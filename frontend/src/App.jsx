import React, { useState } from 'react';
import { Upload, Activity, Download, Loader2, CheckCircle, AlertCircle, Zap, BarChart3, ArrowLeft } from 'lucide-react';

const ECGDigitizer = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [leadName, setLeadName] = useState('');
  const [calibration, setCalibration] = useState({
    sec_per_pixel: 0.004,
    mV_per_pixel: 0.01,
    y_shift_ratio: 0.5
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setError(null);
      setResults(null);
      
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setError('Please select a valid image file');
    }
  };

  const processECG = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProcessingStage('Uploading image...');

    const formData = new FormData();
    formData.append('ecg_image', file);
    
    if (leadName.trim()) {
      formData.append('lead_name', leadName.trim());
    }
    
    formData.append('sec_per_pixel', calibration.sec_per_pixel);
    formData.append('mV_per_pixel', calibration.mV_per_pixel);
    formData.append('y_shift_ratio', calibration.y_shift_ratio);

    try {
      setProcessingStage('Running AI inference...');
      const response = await fetch('http://localhost:5001/api/digitize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();
      setResults(data);
      setProcessingStage('');
    } catch (err) {
      setError(err.message || 'Failed to process ECG image');
      setProcessingStage('');
    } finally {
      setProcessing(false);
    }
  };

  const downloadCSV = () => {
    if (!results || !results.signal) return;

    let csv = 'Time(s),Amplitude(mV)\n';
    
    results.signal.forEach((value, index) => {
      const time = (index / 500).toFixed(4);
      csv += `${time},${value}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecg_signal${leadName ? '_' + leadName : ''}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetApp = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
    setLeadName('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      padding: '0'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00d9ff 0%, #a78bfa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity style={{ width: '24px', height: '24px', color: '#000' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #00d9ff 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0
                }}>
                  ECG Digitizer
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  marginTop: '4px',
                  margin: 0
                }}>
                  AI-Powered Signal Extraction
                </p>
              </div>
            </div>
            {results && (
              <button
                onClick={resetApp}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                New Analysis
              </button>
            )}
          </div>
        </div>

        {!results ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '32px'
          }}>
            {/* Upload Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(40px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '32px'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  margin: 0
                }}>
                  Upload ECG Image
                </h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '14px',
                  margin: 0
                }}>
                  Drop your ECG scan or click to browse
                </p>
              </div>
              
              <div style={{
                position: 'relative',
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '64px 32px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 217, 255, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <Upload style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  strokeWidth: 1.5
                }} />
                <p style={{
                  color: '#d1d5db',
                  marginBottom: '4px',
                  fontSize: '16px'
                }}>
                  Drop ECG image here
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  PNG, JPG, JPEG
                </p>
              </div>

              {preview && (
                <div style={{
                  marginTop: '24px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              {file && !processing && (
                <button
                  onClick={processECG}
                  style={{
                    width: '100%',
                    marginTop: '24px',
                    background: 'linear-gradient(135deg, #00d9ff, #a78bfa)',
                    color: '#000',
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Zap style={{ width: '20px', height: '20px' }} />
                  Process ECG
                </button>
              )}

              {processing && (
                <div style={{
                  marginTop: '24px',
                  background: 'rgba(0, 217, 255, 0.1)',
                  border: '1px solid rgba(0, 217, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Loader2 style={{
                      width: '20px',
                      height: '20px',
                      color: '#00d9ff',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <div>
                      <p style={{
                        fontWeight: 500,
                        color: '#22d3ee',
                        margin: 0,
                        marginBottom: '4px'
                      }}>
                        Processing
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#9ca3af',
                        margin: 0
                      }}>
                        {processingStage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: '24px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px'
                }}>
                  <AlertCircle style={{
                    width: '20px',
                    height: '20px',
                    color: '#ef4444',
                    flexShrink: 0,
                    marginTop: '2px'
                  }} />
                  <p style={{
                    color: '#fca5a5',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Configuration Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  marginBottom: '16px'
                }}>
                  Lead Information
                </h3>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Lead Name
                  </label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="V5, II, aVL..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0, 217, 255, 0.5)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <BarChart3 style={{ width: '20px', height: '20px', color: '#00d9ff' }} />
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    margin: 0
                  }}>
                    Calibration
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      Seconds per pixel
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={calibration.sec_per_pixel}
                      onChange={(e) => setCalibration({...calibration, sec_per_pixel: parseFloat(e.target.value)})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <p style={{
                      fontSize: '12px',
                      color: '#4b5563',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>
                      Default: 0.004
                    </p>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      mV per pixel
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={calibration.mV_per_pixel}
                      onChange={(e) => setCalibration({...calibration, mV_per_pixel: parseFloat(e.target.value)})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <p style={{
                      fontSize: '12px',
                      color: '#4b5563',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>
                      Default: 0.01
                    </p>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      Y-shift ratio
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={calibration.y_shift_ratio}
                      onChange={(e) => setCalibration({...calibration, y_shift_ratio: parseFloat(e.target.value)})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <p style={{
                      fontSize: '12px',
                      color: '#4b5563',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>
                      Default: 0.5
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <CheckCircle style={{ width: '32px', height: '32px', color: '#10b981' }} />
              <div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#6ee7b7',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  Analysis Complete
                </h3>
                <p style={{
                  color: 'rgba(16, 185, 129, 0.7)',
                  fontSize: '14px',
                  margin: 0
                }}>
                  Signal extracted successfully
                </p>
              </div>
            </div>

            {results.metadata && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '32px'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '24px'
                }}>
                  Signal Metadata
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '24px'
                }}>
                  {results.metadata.lead_name && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{
                        color: '#6b7280',
                        fontSize: '12px',
                        marginBottom: '8px',
                        margin: 0
                      }}>
                        Lead
                      </p>
                      <p style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #00d9ff, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        margin: 0
                      }}>
                        {results.metadata.lead_name}
                      </p>
                    </div>
                  )}
                  <div>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      marginBottom: '8px',
                      margin: 0
                    }}>
                      Sampling Rate
                    </p>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      {results.metadata.sampling_rate} Hz
                    </p>
                  </div>
                  <div>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      marginBottom: '8px',
                      margin: 0
                    }}>
                      Duration
                    </p>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      {results.metadata.duration.toFixed(2)}s
                    </p>
                  </div>
                  <div>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      marginBottom: '8px',
                      margin: 0
                    }}>
                      Samples
                    </p>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      {results.metadata.signal_length}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      marginBottom: '8px',
                      margin: 0
                    }}>
                      Precision
                    </p>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      {results.metadata.mV_per_pixel?.toFixed(4)} mV
                    </p>
                  </div>
                </div>
              </div>
            )}

            {results.mask_preview && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '32px'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '24px'
                }}>
                  Segmentation Mask
                </h3>
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img 
                    src={`data:image/png;base64,${results.mask_preview}`} 
                    alt="Mask" 
                    style={{
                      width: '100%',
                      display: 'block',
                      background: '#fff'
                    }}
                  />
                </div>
              </div>
            )}

            {results.plot && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '32px'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '24px'
                }}>
                  Signal Waveform
                </h3>
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img 
                    src={`data:image/png;base64,${results.plot}`} 
                    alt="ECG Plot" 
                    style={{
                      width: '100%',
                      display: 'block',
                      background: '#fff'
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={downloadCSV}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                color: '#fff',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Download style={{ width: '20px', height: '20px' }} />
              Download CSV Data
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ECGDigitizer;