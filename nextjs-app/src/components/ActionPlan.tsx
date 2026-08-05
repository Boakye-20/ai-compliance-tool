import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';

interface ActionPlanProps {
  actionPlan: Array<{ priority: 'P1'|'P2'|'P3'|'P4'; action: string; effort_days: number; owner: string; }>;
}

export function ActionPlan({ actionPlan }: ActionPlanProps) {
  const totalEffort = actionPlan.reduce((sum, item) => sum + item.effort_days, 0);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'P1':
        return { color: 'text-red-700 bg-red-100 border-red-200', icon: <AlertTriangle className="w-5 h-5 text-red-600" /> };
      case 'P2':
        return { color: 'text-orange-700 bg-orange-100 border-orange-200', icon: <AlertTriangle className="w-5 h-5 text-orange-600" /> };
      case 'P3':
        return { color: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: <Info className="w-5 h-5 text-yellow-600" /> };
      case 'P4':
        return { color: 'text-blue-700 bg-blue-100 border-blue-200', icon: <CheckCircle className="w-5 h-5 text-blue-600" /> };
      default:
        return { color: 'text-gray-700 bg-gray-100 border-gray-200', icon: <Info className="w-5 h-5 text-gray-600" /> };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Remediation Action Plan</h3>
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Total Estimated Effort: {totalEffort} days</span>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {actionPlan.map((item, index) => {
            const config = getPriorityConfig(item.priority);
            return (
              <li key={index}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 mr-4">
                      {config.icon}
                      <p className="text-sm font-medium text-gray-900 break-words">{item.action}</p>
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${config.color}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Owner: {item.owner}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <Clock className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <p>
                        {item.effort_days} {item.effort_days === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
