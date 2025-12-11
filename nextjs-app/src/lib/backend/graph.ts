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

        // Analyze (sequential to avoid Perplexity rate limiting)
        if (state.selected_frameworks.includes('ICO')) {
            log('Analyzing ICO compliance...');
            state.ico_result = await analyzeICOCompliance(state.extracted_data);
            log(`ICO: ${state.ico_result.score}% (${state.ico_result.critical_gaps_count} critical gaps)`);
        }

        if (state.selected_frameworks.includes('DPA')) {
            log('Analyzing DPA/GDPR compliance...');
            state.dpa_result = await analyzeDPACompliance(state.extracted_data);
            log(`DPA: ${state.dpa_result.score}% (${state.dpa_result.critical_gaps_count} critical gaps)`);
        }

        if (state.selected_frameworks.includes('EU_AI_ACT')) {
            log('Analyzing EU AI Act compliance...');
            state.eu_act_result = await analyzeEUActCompliance(state.extracted_data);
            log(`EU AI Act: ${state.eu_act_result.score}% - ${state.eu_act_result.risk_tier}`);
        }

        if (state.selected_frameworks.includes('ISO_42001')) {
            log('Analyzing ISO 42001 compliance...');
            state.iso_result = await analyzeISOCompliance(state.extracted_data);
            log(`ISO 42001: ${state.iso_result.score}% (${state.iso_result.critical_gaps_count} critical gaps)`);
        }

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
