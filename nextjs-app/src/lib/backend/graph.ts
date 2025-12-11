import { ComplianceState, FrameworkCode } from './types';
import { extractPdfData } from '../agents/extractor';
import { routeFrameworks } from '../agents/router';
import { analyzeICOCompliance } from '../agents/icoAgent';
import { analyzeDPACompliance } from '../agents/dpaAgent';
import { analyzeEUActCompliance } from '../agents/euActAgent';
import { analyzeISOCompliance } from '../agents/isoAgent';
import { synthesizeGaps } from '../agents/synthesizer';
import { generateReport } from '../pdf/generateReport';

export async function runCompliancePipeline(
    pdfBuffer: Buffer,
    selectedFrameworks: FrameworkCode[],
    onStatus?: (msg: string) => void,
): Promise<ComplianceState> {
    const state: ComplianceState = {
        pdf_path: '',
        extracted_data: null,
        selected_frameworks: selectedFrameworks,
        ico_result: null,
        eu_act_result: null,
        dpa_result: null,
        iso_result: null,
        synthesis: null,
        report_bytes: null,
        status_messages: [],
    };

    const log = (msg: string) => {
        state.status_messages.push(msg);
        onStatus?.(msg);
    };

    try {
        // Extract
        log('📄 Extracting document data...');
        state.extracted_data = await extractPdfData(pdfBuffer);
        log(`✅ Extracted: ${state.extracted_data.document_type} document`);

        // Route
        log('🧭 Routing to frameworks...');
        state.selected_frameworks = routeFrameworks(state.extracted_data, selectedFrameworks);
        log(`✅ Frameworks: ${state.selected_frameworks.join(', ')}`);

        // Analyze (parallel)
        const jobs: Promise<void>[] = [];

        if (state.selected_frameworks.includes('ICO')) {
            log('🔍 Analyzing ICO compliance...');
            jobs.push(
                analyzeICOCompliance(state.extracted_data).then((result) => {
                    state.ico_result = result;
                    log(`✅ ICO: ${result.score}% (${result.critical_gaps_count} critical gaps)`);
                }),
            );
        }

        if (state.selected_frameworks.includes('DPA')) {
            log('🔍 Analyzing DPA/GDPR compliance...');
            jobs.push(
                analyzeDPACompliance(state.extracted_data).then((result) => {
                    state.dpa_result = result;
                    log(`✅ DPA: ${result.score}% (${result.critical_gaps_count} critical gaps)`);
                }),
            );
        }

        if (state.selected_frameworks.includes('EU_AI_ACT')) {
            log('🔍 Analyzing EU AI Act compliance...');
            jobs.push(
                analyzeEUActCompliance(state.extracted_data).then((result) => {
                    state.eu_act_result = result;
                    log(`✅ EU AI Act: ${result.score}% - ${result.risk_tier}`);
                }),
            );
        }

        if (state.selected_frameworks.includes('ISO_42001')) {
            log('🔍 Analyzing ISO 42001 compliance...');
            jobs.push(
                analyzeISOCompliance(state.extracted_data).then((result) => {
                    state.iso_result = result;
                    log(`✅ ISO 42001: ${result.score}% (${result.critical_gaps_count} critical gaps)`);
                }),
            );
        }

        await Promise.all(jobs);

        // Synthesize
        log('📊 Synthesizing results...');
        state.synthesis = synthesizeGaps(
            state.ico_result,
            state.eu_act_result,
            state.dpa_result,
            state.iso_result,
            state.selected_frameworks,
        );
        log(`✅ UK Alignment Score: ${state.synthesis.uk_alignment_score}%`);

        // Report
        log('📝 Generating PDF report...');
        state.report_bytes = await generateReport(
            state.extracted_data,
            state.ico_result,
            state.eu_act_result,
            state.dpa_result,
            state.iso_result,
            state.synthesis,
        );
        log('✅ Report ready');

        return state;
    } catch (error) {
        log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}
