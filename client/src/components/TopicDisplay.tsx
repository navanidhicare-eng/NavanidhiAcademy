import { useState, useEffect } from 'react';
import { MathJaxComponent } from '@/components/ui/MathJax';

interface TopicDisplayProps {
  topic: {
    id: string;
    name: string;
    description?: string;
    isModerate?: boolean;
    isImportant?: boolean;
  };
  className?: string;
}

export function TopicDisplay({ topic, className = "" }: TopicDisplayProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <h3 className="font-medium">{topic.name}</h3>
        {topic.isImportant && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
            IMP
          </span>
        )}
        {topic.isModerate && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
            Moderate
          </span>
        )}
      </div>
      
      {topic.description && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showPreview ? 'Hide' : 'Show'} Math Preview
            </button>
          </div>
          
          {showPreview ? (
            <div className="p-3 bg-gray-50 rounded-md border">
              <h4 className="text-sm font-medium mb-2">Rendered Math:</h4>
              <MathJaxComponent>{topic.description}</MathJaxComponent>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-md border">
              <h4 className="text-sm font-medium mb-2">Raw Content:</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {topic.description}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TopicDisplay;