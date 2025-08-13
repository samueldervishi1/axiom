import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/modelDocs.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const ModelDocs = () => {
  const [activeTab, setActiveTab] = useState('models');
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const modelDetailsRef = useRef(null);

  const statusInfo = {
    current: { label: 'Current', color: '#10b981', priority: 1 },
    beta: { label: 'Beta', color: '#3b82f6', priority: 2 },
    supported: { label: 'Supported', color: '#8b5cf6', priority: 3 },
    legacy: { label: 'Legacy', color: '#f59e0b', priority: 4 },
    deprecated: { label: 'Deprecated', color: '#ef4444', priority: 5 },
    'end-of-life': { label: 'End of Life', color: '#dc2626', priority: 6 },
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}llm`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setModels(response.data);

        const currentModel = response.data.find((m) => m.status === 'current');
        if (currentModel) {
          setSelectedModel(currentModel.modelId);
        } else if (response.data.length > 0) {
          setSelectedModel(response.data[0].modelId);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('Failed to load AI models. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);

    // Smooth scroll to model details section
    setTimeout(() => {
      if (modelDetailsRef.current) {
        modelDetailsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }
    }, 100); // Small delay to ensure the details section has rendered
  };

  const tabs = [
    { id: 'models', label: 'Available Models' },
    { id: 'api', label: 'API Usage' },
    { id: 'migration', label: 'Migration Guide' },
  ];

  const renderModels = () => {
    if (loading) return <div className={styles.loading}>Loading models...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    const sortedModels = [...models].sort((a, b) => {
      return new Date(b.dateTime) - new Date(a.dateTime);
    });

    return (
      <div className={styles.models_content}>
        <div className={styles.models_grid}>
          {sortedModels.map((model) => (
            <div
              key={model.modelId}
              className={`${styles.model_card} ${selectedModel === model.modelId ? styles.selected : ''}`}
              onClick={() => handleModelSelect(model.modelId)}
            >
              <div className={styles.model_header}>
                <h4>{model.modelName}</h4>
                <span
                  className={`${styles.status_badge} ${styles[model.status]}`}
                  style={{ backgroundColor: statusInfo[model.status]?.color }}
                >
                  {statusInfo[model.status]?.label}
                </span>
              </div>

              <div className={styles.model_meta}>
                <small>Version: {model.version}</small>
                <small>
                  Updated: {new Date(model.dateTime).toLocaleDateString()}
                </small>
                <small>ID: {model.modelId}</small>
              </div>

              {(model.parameters || model.maxTokens || model.architecture) && (
                <div className={styles.model_specs}>
                  {model.parameters && (
                    <div className={styles.spec_item}>
                      <span className={styles.spec_label}>Parameters:</span>
                      <span className={styles.spec_value}>
                        {model.parameters}
                      </span>
                    </div>
                  )}
                  {model.maxTokens && (
                    <div className={styles.spec_item}>
                      <span className={styles.spec_label}>Max Tokens:</span>
                      <span className={styles.spec_value}>
                        {model.maxTokens.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {model.architecture && (
                    <div className={styles.spec_item}>
                      <span className={styles.spec_label}>Architecture:</span>
                      <span className={styles.spec_value}>
                        {model.architecture}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.model_description}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: model.changes.substring(0, 200) + '...',
                  }}
                />
              </div>

              {model.status === 'beta' && (
                <div className={styles.beta_notice}>
                  Beta: May have limited availability and experimental features
                </div>
              )}

              {(model.status === 'deprecated' ||
                model.status === 'end-of-life') && (
                <div className={styles.warning}>
                  {model.status === 'end-of-life'
                    ? 'End of Life'
                    : 'Deprecated'}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedModel && (
          <div className={styles.model_details} ref={modelDetailsRef}>
            {(() => {
              const model = models.find((m) => m.modelId === selectedModel);
              if (!model) return null;

              return (
                <>
                  <h3>Model Details: {model.modelName}</h3>

                  <div className={styles.model_info_grid}>
                    <div className={styles.info_item}>
                      <strong>Model ID:</strong> {model.modelId}
                    </div>
                    <div className={styles.info_item}>
                      <strong>Version:</strong> {model.version}
                    </div>
                    <div className={styles.info_item}>
                      <strong>Status:</strong> {statusInfo[model.status]?.label}
                    </div>
                    <div className={styles.info_item}>
                      <strong>Last Updated:</strong>{' '}
                      {new Date(model.dateTime).toLocaleString()}
                    </div>
                    {model.parameters && (
                      <div className={styles.info_item}>
                        <strong>Parameters:</strong> {model.parameters}
                      </div>
                    )}
                    {model.maxTokens && (
                      <div className={styles.info_item}>
                        <strong>Max Tokens:</strong>{' '}
                        {model.maxTokens.toLocaleString()}
                      </div>
                    )}
                    {model.architecture && (
                      <div className={styles.info_item}>
                        <strong>Architecture:</strong> {model.architecture}
                      </div>
                    )}
                    {model.trainingData && (
                      <div className={styles.info_item}>
                        <strong>Training Data:</strong> {model.trainingData}
                      </div>
                    )}
                    {model.capabilities && (
                      <div className={styles.info_item}>
                        <strong>Capabilities:</strong> {model.capabilities}
                      </div>
                    )}
                  </div>

                  <div className={styles.capabilities_section}>
                    <h4>Description & Capabilities</h4>
                    <div className={styles.full_description}>
                      <div
                        dangerouslySetInnerHTML={{ __html: model.changes }}
                      />
                    </div>
                  </div>

                  <div className={styles.usage_code}>
                    <h4>Usage Example</h4>
                    <pre className={styles.code_block}>
                      {`POST http://localhost:8080/axiom/api/core/v4.0.0/loom/mindstream/generate

{
  "model": "${model.modelId}",
  "prompt": "Your message here",
  "temperature": 0.7,
  "max_tokens": 1000
}`}
                    </pre>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const renderAPI = () => {
    return (
      <div className={styles.api_content}>
        <h2 style={{ textAlign: 'center' }}>API Overview</h2>

        <div className={styles.api_section}>
          <h3>Accessing the API</h3>
          <p>
            The API is made available via our web Console. You can use the
            Workbench to try out the API in the browser and then generate API
            keys in Account Settings. Use workspaces to segment your API keys
            and control spend by use case.
          </p>
        </div>

        <div className={styles.api_section}>
          <h3>Authentication</h3>
          <p>
            All requests to the Axiom API must include an <code>x-api-key</code>{' '}
            header with your API key. If you are using the Client SDKs, you will
            set the API when constructing a client, and then the SDK will send
            the header on your behalf with every request.
          </p>
          <pre className={styles.code_block}>
            {`x-api-key: YOUR_API_KEY
content-type: application/json`}
          </pre>
        </div>

        <div className={styles.api_section}>
          <h3>Content Types</h3>
          <p>
            The Axiom API always accepts JSON in request bodies and returns JSON
            in response bodies. You will need to send the{' '}
            <code>content-type: application/json</code> header in requests. If
            you are using the Client SDKs, this will be taken care of
            automatically.
          </p>
        </div>

        <div className={styles.api_section}>
          <h3>Request Size Limits</h3>
          <p>
            The API has a maximum request size of 32 MB for standard endpoints,
            including the Messages API and Token Counting API. If you exceed
            this limit, you'll receive a 413 <code>request_too_large</code>{' '}
            error from Cloudflare. Specific endpoints have different limits:
          </p>
          <ul>
            <li>
              <strong>Standard endpoints</strong> (Messages, Token Counting): 32
              MB
            </li>
            <li>
              <strong>Batch API</strong>: 256 MB
            </li>
            <li>
              <strong>Files API</strong>: 500 MB
            </li>
          </ul>
        </div>

        <div className={styles.api_section}>
          <h3>Response Headers</h3>
          <p>The Axiom API includes the following headers in every response:</p>
          <ul>
            <li>
              <code>request-id</code>: A globally unique identifier for the
              request.
            </li>
          </ul>
        </div>

        <div className={styles.api_section}>
          <h3>Examples</h3>

          <div className={styles.example_section}>
            <h4>cURL</h4>
            <pre className={styles.code_block}>
              {`curl http://localhost:8080/axiom/api/core/v16-loom/generate \\
     --header "x-api-key: $AXIOM_API_KEY" \\
     --header "content-type: application/json" \\
     --data \\
'{
    "model": "sophia-ultimate-240725",
    "max_tokens": 1024,
    "messages": [
        {"role": "user", "content": "Hello, world"}
    ]
}'`}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const renderMigration = () => {
    if (loading) return <div className={styles.loading}>Loading models...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
      <div className={styles.migration_content}>
        <h2 style={{ textAlign: 'center' }}>Migration Guide</h2>
        <p style={{ textAlign: 'center' }}>
          Step-by-step guide to migrate from older models to current, supported
          versions with updated API features.
        </p>

        <div className={styles.migration_overview}>
          <h3>Migration Is Not That Simple</h3>
          <p>
            <strong>Important:</strong> Migration is more complex than just
            changing the model ID. It involves new API features and updated
            parameters.
          </p>

          <div className={styles.api_changes}>
            <h4>New API Features</h4>
            <div className={styles.feature_card}>
              <h5>Text Editor Tool (text_editor_20250728)</h5>
              <p>
                An updated text editor tool that fixes some issues from previous
                versions and adds an optional <code>max_characters</code>{' '}
                parameter that allows you to control the truncation length when
                viewing large files.
              </p>
              <pre className={styles.code_block}>
                {`{
  "tool": "text_editor_20250728",
  "parameters": {
    "max_characters": 5000
  }
}`}
              </pre>
            </div>
          </div>

          <div className={styles.model_updates}>
            <h4>Sophia Ultimate Model Updates</h4>
            <div className={styles.update_card}>
              <h5>Increased Rate Limits</h5>
              <p>
                Increased rate limits for Sophia Ultimate on the Axiom API to
                give you more capacity to build and scale with Sophia. For
                customers with usage tier 1-4 rate limits, these changes apply
                immediately to your account - no action needed.
              </p>
            </div>

            <div className={styles.update_card}>
              <h5>New Refusal Stop Reason</h5>
              <p>
                Sophia Ultimate now includes a new "refusal" stop reason in
                responses:
              </p>
              <pre className={styles.code_block}>
                {`{
  "id": "msg_014XEDjypDjFzgKVWdFUXxZP",
  "type": "message",
  "role": "assistant",
  "model": "sophia-ultimate-240725",
  "content": [{"type": "text", "text": "I would be happy to assist you. You can "}],
  "stop_reason": "refusal",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 564,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "output_tokens": 22
  }
}`}
              </pre>
            </div>
          </div>

          <div className={styles.deprecated_features}>
            <h4>Deprecated Features</h4>
            <div className={styles.deprecation_notice}>
              <h5>Token-Efficient Tool Use No Longer Supported</h5>
              <p>
                <strong>Important:</strong> Token-efficient tool use is only
                available in Sophia Ultra and is no longer supported in newer
                models.
              </p>
              <p>
                If you're migrating from Sophia Ultra and using token-efficient
                tool use, we recommend removing the{' '}
                <code>token-efficient-tools-2025-02-19</code> beta header from
                your requests.
              </p>
              <p>
                The <code>token-efficient-tools-2025-02-19</code> beta header
                can still be included in Sophia Ultimate requests, but it will
                have no effect.
              </p>
            </div>
          </div>

          <div className={styles.additional_features}>
            <h4>Additional Model Features</h4>
            <ul>
              <li>
                <strong>Summarized Thinking:</strong> Enhanced reasoning
                capabilities
              </li>
              <li>
                <strong>Interval Thinking:</strong> Improved processing
                intervals
              </li>
              <li>
                <strong>Token-Efficient Tool Use:</strong> Optimization for
                better performance (Sophia Ultra only)
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.migration_help}>
          <h3>Need Help with Migration?</h3>
          <div className={styles.help_options}>
            <div className={styles.help_option}>
              <h4>Contact Support</h4>
              <p>
                Email us at <strong>support@axiom.com</strong> for migration
                assistance
              </p>
            </div>
            <div className={styles.help_option}>
              <h4>Migration Steps</h4>
              <ol>
                <li>Identify your current model ID and features in use</li>
                <li>Review new API features and parameters</li>
                <li>
                  Remove deprecated headers like{' '}
                  <code>token-efficient-tools-2025-02-19</code>
                </li>
                <li>Update model ID and implement new features as needed</li>
                <li>
                  Test thoroughly including new stop reasons and tool parameters
                </li>
                <li>Deploy with proper error handling for refusal responses</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'models':
        return renderModels();
      case 'api':
        return renderAPI();
      case 'migration':
        return renderMigration();
      default:
        return renderModels();
    }
  };

  return (
    <div className={styles.model_docs_container}>
      <div className={styles.docs_header}>
        <h1>AI Models Documentation</h1>
        <p>
          Complete guide to Axiom's AI models, API usage, and migration
          information.
        </p>
      </div>

      <div className={styles.tabs_container}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab_button} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content_container}>{renderContent()}</div>
    </div>
  );
};

export default ModelDocs;
