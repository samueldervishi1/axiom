// AI Models documentation and data
export const aiModels = {
  'sophia-ultimate-240725': {
    name: 'Sophia Ultimate',
    version: '24.07.25',
    status: 'current',
    description:
      'The most advanced and capable model in our lineup, featuring enhanced reasoning, creative writing, and technical problem-solving capabilities.',
    capabilities: [
      'Advanced natural language understanding',
      'Creative writing and storytelling',
      'Complex reasoning and analysis',
      'Technical problem solving',
      'Code generation and debugging',
      'Multi-turn conversations with context retention',
      'Educational content and explanations',
    ],
    limits: {
      maxTokens: 4000,
      messagesPerHour: 200,
      contextWindow: 32000,
      concurrent: 3,
    },
    pricing: 'Free',
    releaseDate: '2024-07-25',
  },
  'sophia-ultra-310725': {
    name: 'Sophia Ultra',
    version: '31.07.25',
    status: 'beta',
    description:
      'Our experimental cutting-edge model with the latest improvements in reasoning and creativity. Currently in beta testing.',
    capabilities: [
      'Experimental reasoning capabilities',
      'Enhanced creative output',
      'Improved code understanding',
      'Advanced problem decomposition',
      'Multi-modal understanding (planned)',
      'Extended context awareness',
      'Specialized domain expertise',
    ],
    limits: {
      maxTokens: 4000,
      messagesPerHour: 100,
      contextWindow: 64000,
      concurrent: 2,
    },
    pricing: 'Free (Beta)',
    releaseDate: '2024-07-31',
    betaFeatures: [
      'May produce unexpected outputs',
      'Limited availability during peak hours',
      'Feedback collection enabled',
    ],
  },
  'sophia-supreme-150824': {
    name: 'Sophia Supreme',
    version: '15.08.24',
    status: 'supported',
    description:
      'High-performance model optimized for professional and business use cases with reliable, consistent outputs.',
    capabilities: [
      'Professional communication',
      'Business analysis and insights',
      'Technical documentation',
      'Code review and optimization',
      'Data analysis interpretation',
      'Strategic planning assistance',
      'Research and fact-checking',
    ],
    limits: {
      maxTokens: 3000,
      messagesPerHour: 300,
      contextWindow: 24000,
      concurrent: 5,
    },
    pricing: 'Free',
    releaseDate: '2024-08-15',
  },
  'sophia-pro-200224': {
    name: 'Sophia Pro',
    version: '20.02.24',
    status: 'supported',
    description:
      'Balanced model for general-purpose applications with good performance across various tasks.',
    capabilities: [
      'General conversation',
      'Content creation',
      'Basic coding assistance',
      'Educational support',
      'Writing improvement',
      'Simple analysis tasks',
      'Q&A and explanations',
    ],
    limits: {
      maxTokens: 2500,
      messagesPerHour: 400,
      contextWindow: 16000,
      concurrent: 10,
    },
    pricing: 'Free',
    releaseDate: '2024-02-20',
  },
  'sophia-advanced-080923': {
    name: 'Sophia Advanced',
    version: '08.09.23',
    status: 'end-of-life',
    description:
      'Previous generation model. Service will be discontinued on March 1, 2025.',
    capabilities: [
      'Basic conversation',
      'Simple content generation',
      'Elementary code assistance',
      'Basic Q&A',
    ],
    limits: {
      maxTokens: 2000,
      messagesPerHour: 200,
      contextWindow: 8000,
      concurrent: 5,
    },
    pricing: 'Free (until EOL)',
    releaseDate: '2023-09-08',
    discontinuationDate: '2025-03-01',
    migrationPath: 'sophia-pro-200224',
  },
  'sophia-multimodal-120423': {
    name: 'Sophia Multimodal',
    version: '12.04.23',
    status: 'deprecated',
    description:
      'Experimental multimodal model. Deprecated in favor of upcoming multimodal features in Sophia Ultra.',
    capabilities: [
      'Text and image understanding (limited)',
      'Basic multimodal reasoning',
      'Simple visual Q&A',
    ],
    limits: {
      maxTokens: 1500,
      messagesPerHour: 50,
      contextWindow: 8000,
      concurrent: 2,
    },
    pricing: 'Free (deprecated)',
    releaseDate: '2023-04-12',
    deprecationDate: '2024-01-15',
    migrationPath: 'sophia-ultra-310725',
  },
  'sophia-constitutional-301122': {
    name: 'Sophia Constitutional',
    version: '30.11.22',
    status: 'deprecated',
    description:
      'Safety-focused model with constitutional AI principles. Deprecated in favor of improved safety in current models.',
    capabilities: [
      'Safe, helpful responses',
      'Ethical reasoning',
      'Harm reduction',
      'Basic conversation',
    ],
    limits: {
      maxTokens: 1800,
      messagesPerHour: 150,
      contextWindow: 6000,
      concurrent: 3,
    },
    pricing: 'Free (deprecated)',
    releaseDate: '2022-11-30',
    deprecationDate: '2024-06-01',
    migrationPath: 'sophia-pro-200224',
  },
  'sophia-expert-180622': {
    name: 'Sophia Expert',
    version: '18.06.22',
    status: 'deprecated',
    description:
      'Specialized model for expert-level tasks. No longer maintained.',
    capabilities: [
      'Domain expertise',
      'Technical analysis',
      'Research assistance',
    ],
    limits: {
      maxTokens: 2000,
      messagesPerHour: 100,
      contextWindow: 8000,
      concurrent: 2,
    },
    pricing: 'Free (deprecated)',
    releaseDate: '2022-06-18',
    deprecationDate: '2024-01-01',
    migrationPath: 'sophia-supreme-150824',
  },
  'sophia-instruct-100122': {
    name: 'Sophia Instruct',
    version: '10.01.22',
    status: 'legacy',
    description:
      'Instruction-following model. Maintained for compatibility but not recommended for new applications.',
    capabilities: [
      'Instruction following',
      'Task completion',
      'Basic reasoning',
    ],
    limits: {
      maxTokens: 1500,
      messagesPerHour: 200,
      contextWindow: 4000,
      concurrent: 5,
    },
    pricing: 'Free (legacy)',
    releaseDate: '2022-01-10',
    migrationPath: 'sophia-pro-200224',
  },
  'sophia-enhanced-220821': {
    name: 'Sophia Enhanced',
    version: '22.08.21',
    status: 'legacy',
    description: 'Enhanced version of base model. Legacy support only.',
    capabilities: [
      'Enhanced conversation',
      'Improved reasoning',
      'Better context understanding',
    ],
    limits: {
      maxTokens: 1200,
      messagesPerHour: 250,
      contextWindow: 4000,
      concurrent: 8,
    },
    pricing: 'Free (legacy)',
    releaseDate: '2021-08-22',
    migrationPath: 'sophia-pro-200224',
  },
  'sophia-base-150321': {
    name: 'Sophia Base',
    version: '15.03.21',
    status: 'legacy',
    description:
      'Original base model. Available for compatibility with older applications.',
    capabilities: ['Basic conversation', 'Simple Q&A', 'Text generation'],
    limits: {
      maxTokens: 1000,
      messagesPerHour: 300,
      contextWindow: 2000,
      concurrent: 10,
    },
    pricing: 'Free (legacy)',
    releaseDate: '2021-03-15',
    migrationPath: 'sophia-pro-200224',
  },
};

// Status definitions
export const statusInfo = {
  current: {
    label: 'Current',
    description:
      'Latest production model with full support and regular updates',
    color: '#10b981',
    priority: 1,
  },
  beta: {
    label: 'Beta',
    description: 'Experimental model in testing phase with latest features',
    color: '#3b82f6',
    priority: 2,
  },
  supported: {
    label: 'Supported',
    description: 'Stable production model with ongoing maintenance',
    color: '#8b5cf6',
    priority: 3,
  },
  legacy: {
    label: 'Legacy',
    description:
      'Older model maintained for compatibility, migration recommended',
    color: '#f59e0b',
    priority: 4,
  },
  deprecated: {
    label: 'Deprecated',
    description: 'No longer maintained, will be discontinued soon',
    color: '#ef4444',
    priority: 5,
  },
  'end-of-life': {
    label: 'End of Life',
    description: 'Service will be terminated, immediate migration required',
    color: '#dc2626',
    priority: 6,
  },
};

// API Usage Examples
export const apiExamples = {
  basic: {
    title: 'Basic Chat Request',
    description: 'Simple conversation with an AI model',
    code: `POST /api/chat/conversations/{conversation_id}/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Explain quantum computing in simple terms",
  "model": "sophia-ultimate-240725",
  "settings": {
    "max_tokens": 2000,
    "temperature": 0.7
  }
}`,
  },
  modelSelection: {
    title: 'Model Selection',
    description: 'How to specify which model to use',
    code: `{
  "content": "Help me debug this Python code",
  "model": "sophia-supreme-150824",
  "settings": {
    "max_tokens": 3000,
    "temperature": 0.3,
    "response_format": "detailed"
  }
}`,
  },
  migration: {
    title: 'Model Migration Example',
    description: 'Updating from deprecated model to current',
    code: `// Before (deprecated)
{
  "model": "sophia-expert-180622",
  "content": "Analyze this data",
  "max_tokens": 2000
}

// After (recommended)
{
  "model": "sophia-supreme-150824",
  "content": "Analyze this data",
  "settings": {
    "max_tokens": 3000,
    "temperature": 0.5
  }
}`,
  },
};

// Migration guides
export const migrationGuides = {
  'sophia-advanced-080923': {
    from: 'Sophia Advanced',
    to: 'Sophia Pro',
    deadline: '2025-03-01',
    breaking_changes: [
      'max_tokens limit increased from 2000 to 2500',
      'contextWindow expanded from 8000 to 16000',
      'New response format includes additional metadata',
    ],
    code_changes: [
      {
        description: 'Update model identifier in API calls',
        before: '"model": "sophia-advanced-080923"',
        after: '"model": "sophia-pro-200224"',
      },
      {
        description: 'Update token limits in your application',
        before: 'maxTokens: 2000',
        after: 'maxTokens: 2500',
      },
    ],
    benefits: [
      'Better performance and accuracy',
      'Longer context window for complex conversations',
      'Improved handling of technical topics',
      'Active support and updates',
    ],
  },
  'sophia-expert-180622': {
    from: 'Sophia Expert',
    to: 'Sophia Supreme',
    deadline: 'Already deprecated',
    breaking_changes: [
      'Different response structure for technical queries',
      'Enhanced context understanding may change output format',
      'Rate limits changed from 100 to 300 messages per hour',
    ],
    code_changes: [
      {
        description: 'Update model identifier',
        before: '"model": "sophia-expert-180622"',
        after: '"model": "sophia-supreme-150824"',
      },
      {
        description: 'Update rate limiting logic',
        before: 'messagesPerHour: 100',
        after: 'messagesPerHour: 300',
      },
    ],
    benefits: [
      'Superior technical analysis capabilities',
      'Better business insights',
      'More reliable and consistent outputs',
      'Higher rate limits for production use',
    ],
  },
};

// Helper functions
export const getModelsByStatus = (status) => {
  return Object.entries(aiModels)
    .filter(([_, model]) => model.status === status)
    .map(([id, model]) => ({ id, ...model }));
};

export const getCurrentModels = () => {
  return getModelsByStatus('current').concat(
    getModelsByStatus('beta'),
    getModelsByStatus('supported')
  );
};

export const getDeprecatedModels = () => {
  return getModelsByStatus('deprecated').concat(
    getModelsByStatus('end-of-life')
  );
};

export const getRecommendedModel = () => {
  return {
    id: 'sophia-ultimate-240725',
    ...aiModels['sophia-ultimate-240725'],
  };
};

export const getMigrationPath = (modelId) => {
  const model = aiModels[modelId];
  if (model?.migrationPath) {
    return {
      from: model,
      to: aiModels[model.migrationPath],
      guide: migrationGuides[modelId],
    };
  }
  return null;
};
