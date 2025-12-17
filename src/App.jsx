import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function App() {
  const [step, setStep] = useState(1);

  // 교사 예시 (배열로 변경)
  const [styleSamples, setStyleSamples] = useState([
    { id: 1, text: "", required: true },
    { id: 2, text: "", required: false }
  ]);
  const [nextId, setNextId] = useState(3);

  // CSV
  const [students, setStudents] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // 생성
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState("");
  const [generationHistory, setGenerationHistory] = useState({}); // { studentId: [{text, timestamp}] }
  const [selectedTraits, setSelectedTraits] = useState([]); // 선택된 학생 특성
  const [finalSelections, setFinalSelections] = useState({}); // { studentId: text } - 최종 선택된 의견
  const [selectedQItems, setSelectedQItems] = useState({}); // { studentId: { Q1: true, Q2: false, ... } } - 학생별 Q 항목 선택

  // 설정(API 설정)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customAlert, setCustomAlert] = useState({ show: false, message: "" });
  const [apiProvider, setApiProvider] = useState("openai"); // openai, claude, gemini, custom
  const [apiKey, setApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiEndpointInput, setApiEndpointInput] = useState("");
  const [apiModel, setApiModel] = useState("");
  const [apiModelInput, setApiModelInput] = useState("");
  const [showKey, setShowKey] = useState(false);

  // 사전설정된 엔드포인트 및 모델
  const providerConfigs = {
    openai: {
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
    },
    claude: {
      endpoint: "https://api.anthropic.com/v1/messages",
      model: "claude-3-5-sonnet-20241022",
    },
    gemini: {
      endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: "gemini-2.0-flash",
    },
    custom: {
      endpoint: "",
      model: "",
    },
  };

  useEffect(() => {
    const savedProvider = localStorage.getItem("LLM_PROVIDER") || "openai";
    const savedKey = localStorage.getItem("LLM_API_KEY") || "";
    const savedEndpoint = localStorage.getItem("LLM_ENDPOINT") || "";
    const savedModel = localStorage.getItem("LLM_MODEL") || "";
    const savedQItems = localStorage.getItem("SELECTED_Q_ITEMS");
    
    // 작업 데이터 복원
    const savedStep = localStorage.getItem("WORK_STEP");
    const savedStudents = localStorage.getItem("WORK_STUDENTS");
    const savedUploadedFileName = localStorage.getItem("WORK_UPLOADED_FILE_NAME");
    const savedGeneratedText = localStorage.getItem("WORK_GENERATED_TEXT");
    const savedGenerationHistory = localStorage.getItem("WORK_GENERATION_HISTORY");
    const savedFinalSelections = localStorage.getItem("WORK_FINAL_SELECTIONS");
    const savedSelectedTraits = localStorage.getItem("WORK_SELECTED_TRAITS");

    setApiProvider(savedProvider);
    setApiKey(savedKey);
    setApiKeyInput(savedKey);
    setApiEndpoint(savedEndpoint || providerConfigs[savedProvider]?.endpoint);
    setApiEndpointInput(savedEndpoint || providerConfigs[savedProvider]?.endpoint);
    setApiModel(savedModel || providerConfigs[savedProvider]?.model);
    setApiModelInput(savedModel || providerConfigs[savedProvider]?.model);
    
    // Q항목 선택 로드
    if (savedQItems) {
      try {
        setSelectedQItems(JSON.parse(savedQItems));
      } catch (e) {
        console.error("Q항목 로드 실패:", e);
      }
    }
    
    // 작업 데이터 복원
    if (savedStep) setStep(parseInt(savedStep));
    if (savedStudents) {
      try {
        setStudents(JSON.parse(savedStudents));
      } catch (e) {
        console.error("학생 데이터 로드 실패:", e);
      }
    }
    if (savedUploadedFileName) setUploadedFileName(savedUploadedFileName);
    if (savedGeneratedText) setGeneratedText(savedGeneratedText);
    if (savedGenerationHistory) {
      try {
        setGenerationHistory(JSON.parse(savedGenerationHistory));
      } catch (e) {
        console.error("생성 이력 로드 실패:", e);
      }
    }
    if (savedFinalSelections) {
      try {
        setFinalSelections(JSON.parse(savedFinalSelections));
      } catch (e) {
        console.error("최종 선택 로드 실패:", e);
      }
    }
    if (savedSelectedTraits) {
      try {
        setSelectedTraits(JSON.parse(savedSelectedTraits));
      } catch (e) {
        console.error("선택 특성 로드 실패:", e);
      }
    }
  }, []);

  // Q항목 선택이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("SELECTED_Q_ITEMS", JSON.stringify(selectedQItems));
  }, [selectedQItems]);

  // step 변경 시 저장
  useEffect(() => {
    localStorage.setItem("WORK_STEP", step.toString());
  }, [step]);

  // students 변경 시 저장
  useEffect(() => {
    localStorage.setItem("WORK_STUDENTS", JSON.stringify(students));
  }, [students]);

  // uploadedFileName 변경 시 저장
  useEffect(() => {
    localStorage.setItem("WORK_UPLOADED_FILE_NAME", uploadedFileName);
  }, [uploadedFileName]);

  // generatedText 변경 시 저장
  useEffect(() => {
    localStorage.setItem("WORK_GENERATED_TEXT", generatedText);
  }, [generatedText]);

  // generationHistory 변경 시 저장
  useEffect(() => {
    localStorage.setItem("WORK_GENERATION_HISTORY", JSON.stringify(generationHistory));
  }, [generationHistory]);

  // finalSelections 변경 시 저장
  useEffect(() => {
    localStorage.setItem("WORK_FINAL_SELECTIONS", JSON.stringify(finalSelections));
  }, [finalSelections]);

  // selectedTraits 변경 시 저장
  useEffect(() => {
    localStorage.setItem("WORK_SELECTED_TRAITS", JSON.stringify(selectedTraits));
  }, [selectedTraits]);

  const hasKey = !!apiKey;
  const currentEndpoint = apiEndpoint || providerConfigs[apiProvider]?.endpoint;
  const currentModel = apiModel || providerConfigs[apiProvider]?.model;

  const qEntries = useMemo(() => {
    if (!selectedStudent) return [];
    return Object.entries(selectedStudent).filter(([k]) => k.startsWith("Q"));
  }, [selectedStudent]);

  // 학생 특성 목록
  const studentTraits = [
    "성실함", "책임감", "배려심", "협력성", "끈기",
    "차분함", "적극성", "자기주도성", "공감능력", "꾸준함",
    "계획성", "세심함", "친절함", "밝음", "호기심"
  ];

  // 고유 학생 ID 생성 함수
  const generateStudentId = (index) => {
    return `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 학생 데이터에 고유 ID 추가
  const addUniqueIdsToStudents = (studentsData) => {
    return studentsData.map((student, idx) => ({
      ...student,
      _id: generateStudentId(idx)
    }));
  };

  // 종합의견 예시 필드 추가
  const addStyleSample = () => {
    setStyleSamples([...styleSamples, { id: nextId, text: "", required: false }]);
    setNextId(nextId + 1);
  };

  // 종합의견 예시 필드 삭제
  const removeStyleSample = (id) => {
    if (styleSamples.length > 1) {
      setStyleSamples(styleSamples.filter(sample => sample.id !== id));
    }
  };

  // 종합의견 예시 텍스트 업데이트
  const updateStyleSample = (id, text) => {
    setStyleSamples(styleSamples.map(sample => 
      sample.id === id ? { ...sample, text } : sample
    ));
  };

  // 특성 토글
  const toggleTrait = (trait) => {
    setSelectedTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  // 최종 의견 선택
  const selectFinalOpinion = (studentId, text) => {
    setFinalSelections(prev => ({
      ...prev,
      [studentId]: text
    }));
  };

  // CSV 내보내기
  const exportToCSV = () => {
    if (Object.keys(finalSelections).length === 0) {
      alert("⚠️ 선택된 종합의견이 없습니다. 먼저 학생별로 의견을 선택해주세요.");
      return;
    }

    // CSV 헤더
    let csv = "학번,이름,종합의견,글자수\n";

    // 각 학생의 데이터 추가
    students.forEach(student => {
      const studentId = student["_id"]; // 고유 ID 사용
      const finalOpinion = finalSelections[studentId];
      
      if (finalOpinion) {
        const name = student["이름"] || "";
        const studentNum = student["학번 네자리"] || "";
        const charCount = finalOpinion.length;
        
        // CSV 형식으로 변환 (쉼표와 줄바꿈 처리)
        const escapedOpinion = `"${finalOpinion.replace(/"/g, '""')}"`;
        
        csv += `${studentNum},${name},${escapedOpinion},${charCount}\n`;
      }
    });

    // BOM 추가 (한글 깨짐 방지)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    
    // 파일 다운로드
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `종합의견_${timestamp}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ ${Object.keys(finalSelections).length}명의 종합의견이 CSV 파일로 저장되었습니다!`);
  };

  async function generateWithLLM(prompt) {
    if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");
    if (!currentEndpoint) throw new Error("API 엔드포인트가 설정되지 않았습니다.");
    if (!currentModel) throw new Error("모델이 설정되지 않았습니다.");

    // Claude 특별 처리 (Anthropic API 형식)
    if (apiProvider === "claude") {
      return await generateWithClaude(prompt);
    }

    // Gemini 특별 처리
    if (apiProvider === "gemini") {
      return await generateWithGemini(prompt);
    }

    // OpenAI 호환 형식 (OpenAI 등)
    return await generateWithOpenAIFormat(prompt);
  }

  async function generateWithOpenAIFormat(prompt) {
    const response = await fetch(currentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      let msg = "LLM 호출 실패";
      try {
        const err = await response.json();
        msg = err?.error?.message || err?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async function generateWithClaude(prompt) {
    const response = await fetch(currentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: currentModel,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      let msg = "Claude API 호출 실패";
      try {
        const err = await response.json();
        msg = err?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? "";
  }

  async function generateWithGemini(prompt) {
    // Gemini는 REST API를 사용하며 URL에 API 키를 포함
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!response.ok) {
        let msg = "Gemini API 호출 실패";
        try {
          const err = await response.json();
          msg = err?.error?.message || err?.message || `HTTP ${response.status}: ${msg}`;
          console.error("Gemini API Error Details:", err);
        } catch (parseErr) {
          console.error("Gemini API Response Error:", response.status, response.statusText);
          msg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      
      // 응답 구조 확인
      if (!data.candidates || !data.candidates[0]) {
        console.error("Gemini API Response Structure Error:", data);
        throw new Error("Gemini API: 응답 형식이 올바르지 않습니다.");
      }
      
      const text = data.candidates[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error("Gemini API: No text in response", data);
        throw new Error("Gemini API: 응답에 텍스트가 없습니다.");
      }
      
      return text;
    } catch (error) {
      console.error("Gemini API Call Error:", error);
      throw error;
    }
  }

  function openSettings() {
    setApiKeyInput(apiKey || "");
    setApiEndpointInput(apiEndpoint || providerConfigs[apiProvider]?.endpoint);
    setApiModelInput(apiModel || providerConfigs[apiProvider]?.model);
    setIsSettingsOpen(true);
  }

  function copyToClipboardFallback(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setCustomAlert({ 
        show: true, 
        message: "✅ 메일 주소가 복사되었습니다.\n\njune_wook@snu.ms.kr\n\n문의사항을 메일로 보내주세요." 
      });
    } catch (err) {
      setCustomAlert({ 
        show: true, 
        message: "❌ 복사에 실패했습니다.\n\njune_wook@snu.ms.kr\n\n위 주소로 문의사항을 메일로 보내주세요." 
      });
    }
    document.body.removeChild(textArea);
  }

  function handleProviderChange(provider) {
    setApiProvider(provider);
    const config = providerConfigs[provider];
    setApiEndpointInput(config.endpoint);
    setApiModelInput(config.model);
  }

  function saveSettings() {
    const trimmedKey = (apiKeyInput || "").trim();
    const trimmedEndpoint = (apiEndpointInput || "").trim();
    const trimmedModel = (apiModelInput || "").trim();

    if (!trimmedKey) {
      setApiError("API 키를 입력해주세요.");
      return;
    }
    if (!trimmedEndpoint) {
      setApiError("API 엔드포인트를 입력해주세요.");
      return;
    }
    if (!trimmedModel) {
      setApiError("모델명을 입력해주세요.");
      return;
    }

    localStorage.setItem("LLM_PROVIDER", apiProvider);
    localStorage.setItem("LLM_API_KEY", trimmedKey);
    localStorage.setItem("LLM_ENDPOINT", trimmedEndpoint);
    localStorage.setItem("LLM_MODEL", trimmedModel);

    setApiKey(trimmedKey);
    setApiEndpoint(trimmedEndpoint);
    setApiModel(trimmedModel);
    setIsSettingsOpen(false);
    setApiError("");
  }

  function clearSettings() {
    localStorage.removeItem("LLM_PROVIDER");
    localStorage.removeItem("LLM_API_KEY");
    localStorage.removeItem("LLM_ENDPOINT");
    localStorage.removeItem("LLM_MODEL");
    setApiKey("");
    setApiKeyInput("");
    setApiEndpoint("");
    setApiEndpointInput("");
    setApiModel("");
    setApiModelInput("");
    setIsSettingsOpen(false);
    setApiError("");
    setGeneratedText("");
  }

  // 전체 작업 데이터 초기화 함수
  function resetAllData() {
    const confirmed = window.confirm(
      "⚠️ 모든 작업 데이터가 삭제됩니다.\n\nCSV로 저장하지 않은 내용은 복구 불가능합니다.\n\n정말 진행하시겠습니까?"
    );

    if (!confirmed) return;

    // localStorage에서 작업 데이터 삭제
    localStorage.removeItem("WORK_STEP");
    localStorage.removeItem("WORK_STUDENTS");
    localStorage.removeItem("WORK_UPLOADED_FILE_NAME");
    localStorage.removeItem("WORK_GENERATED_TEXT");
    localStorage.removeItem("WORK_GENERATION_HISTORY");
    localStorage.removeItem("WORK_FINAL_SELECTIONS");
    localStorage.removeItem("WORK_SELECTED_TRAITS");
    localStorage.removeItem("SELECTED_Q_ITEMS");

    // 상태 초기화
    setStep(1);
    setStudents([]);
    setUploadedFileName("");
    setGeneratedText("");
    setGenerationHistory({});
    setFinalSelections({});
    setSelectedQItems({});
    setSelectedTraits([]);
    setSelectedStudent(null);
    setCsvError("");
    setApiError("");

    alert("✅ 모든 작업 데이터가 초기화되었습니다!");
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        {/* Top bar */}
        <div style={topBar}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <div style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                📝 생활기록부 종합의견 생성기
              </div>
              <div style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "#fff", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                BUILT WITH CLAUDE
              </div>
              <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                제작: 서울사대부중 1학년부 허철호
              </div>
              <button
                onClick={() => {
                  const email = "june_wook@snu.ms.kr";
                  
                  // 모던 Clipboard API 시도
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(email).then(() => {
                      setCustomAlert({ 
                        show: true, 
                        message: "✅ 메일 주소가 복사되었습니다.\n\njune_wook@snu.ms.kr\n\n문의사항을 메일로 보내주세요." 
                      });
                    }).catch(() => {
                      // 폴백: 레거시 방식
                      copyToClipboardFallback(email);
                    });
                  } else {
                    // 폴백: 레거시 방식
                    copyToClipboardFallback(email);
                  }
                }}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  gap: 8,
                  background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(245, 158, 11, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                title="사용방법 문의 - 클릭하면 메일 주소가 복사됩니다"
              >
                <span>❓</span>
                <span>사용방법 문의</span>
              </button>
            </div>
            <div style={{ fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🔐</span>
              <span>학생 정보 보호가 최우선! 업로드한 XLSX 또는 CSV 파일은 인터넷에 올라가지 않고 선생님 컴퓨터 안에서만 처리돼요. 마치 엑셀 파일을 여는 것처럼 로컬에서만 작동합니다. 안심하고 사용하세요!</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={pill}>
              <span style={{ fontSize: 16, marginRight: 8 }}>🤖</span>
              <span style={{ fontWeight: 800, color: "#1a202c" }}>
                {apiProvider.toUpperCase()}
              </span>
              <span style={{ marginLeft: 8, fontWeight: 700, color: hasKey ? "#10b981" : "#ef4444" }}>
                {hasKey ? "● 연결됨" : "● 미설정"}
              </span>
            </div>
            <button style={btnOutline} onClick={openSettings}>
              ⚙️ 설정
            </button>
            <button 
              style={{
                ...btnOutline,
                borderColor: "#ef4444",
                color: "#ef4444",
              }}
              onClick={resetAllData}
              title="모든 작업 데이터를 초기화합니다"
            >
              🔄 전체 초기화
            </button>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 32 }}>👨‍🏫</div>
              <h2 style={h2}>1단계. 선생님의 어조와 표현 방식을 알아보기</h2>
            </div>
            <p style={desc}>
              <span style={{ fontWeight: 700, color: "#667eea" }}>✨ AI가 선생님의 문체를 학습합니다.</span><br/>
              종합의견은 선생님마다 어조와 표현 방식이 다릅니다. 과거에 작성하신 종합의견을 <span style={{ fontWeight: 700, color: "#f59e0b" }}>많이 입력할수록 선생님만의 독특한 말투와 스타일이 정확하게 반영</span>됩니다.<br/><br/>
              최소 1개 이상 입력해 주세요. <span style={{ fontWeight: 700, color: "#10b981" }}>3~5개를 입력하면 더욱 정확한 결과</span>를 얻을 수 있습니다!<br/>
              (과거 자료가 없다면 평소 사용하시는 말투로 예시를 작성하셔도 좋습니다)
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {styleSamples.map((sample, index) => (
                <div key={sample.id} style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#667eea" }}>
                      종합의견 예시 {index + 1} {sample.required && "(필수)"}
                    </span>
                    {!sample.required && styleSamples.length > 1 && (
                      <button
                        onClick={() => removeStyleSample(sample.id)}
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ 삭제
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder={`종합의견 예시 ${index + 1}을 입력하세요${sample.required ? " (필수)" : " (선택)"}`}
                    value={sample.text}
                    onChange={(e) => updateStyleSample(sample.id, e.target.value)}
                    rows={6}
                    style={ta}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addStyleSample}
              style={{
                ...btnOutline,
                marginTop: 12,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              ➕ 종합의견 예시 추가
            </button>

            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <button
                style={{ ...btn, opacity: styleSamples[0].text ? 1 : 0.5 }}
                disabled={!styleSamples[0].text}
                onClick={() => setStep(2)}
              >
                다음 단계로 →
              </button>
              {!hasKey && (
                <button style={btnOutline} onClick={openSettings}>
                  API 키 먼저 설정하기
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 32 }}>📊</div>
              <h2 style={h2}>2단계. CSV 또는 Excel 파일 불러오기</h2>
            </div>
            <p style={desc}>
              <span style={{ fontWeight: 700, color: "#667eea" }}>📂 구글 설문 응답 데이터를 불러옵니다.</span><br/>
              실제 설문조사 응답을 모아둔 스프레드시트를 XLSX 또는 CSV 형식으로 변환한 다음 여기에 업로드하세요.
            </p>

            {/* 파일 선택 섹션 - 강조됨 */}
            <div>
              {uploadedFileName ? (
                <div style={{ marginTop: 16, padding: "20px", background: "#f0fdf4", border: "3px solid #86efac", borderRadius: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#166534", fontSize: 16 }}>업로드된 파일</div>
                      <div style={{ fontSize: 14, color: "#15803d", marginTop: 4 }}>📄 {uploadedFileName}</div>
                      <div style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>총 {students.length}명의 학생 데이터</div>
                    </div>
                  </div>
                  <button 
                    style={{ ...btnOutline, fontSize: 14, padding: "12px 24px" }}
                    onClick={() => {
                      if (window.confirm("다른 파일을 업로드하시겠습니까? 현재 데이터가 삭제됩니다.")) {
                        setUploadedFileName("");
                        setStudents([]);
                        setCsvError("");
                      }
                    }}
                  >
                    🔄 다른 파일 선택
                  </button>
                </div>
              ) : (
                <div 
                  style={{ marginTop: 16, padding: "24px", background: "linear-gradient(135deg, #f0f9ff 0%, #fef2f2 100%)", border: "3px dashed #3b82f6", borderRadius: 16, textAlign: "center", cursor: "pointer", transition: "all 0.3s" }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = "linear-gradient(135deg, #dbeafe 0%, #fee2e2 100%)";
                    e.currentTarget.style.borderColor = "#2563eb";
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #f0f9ff 0%, #fef2f2 100%)";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = "linear-gradient(135deg, #f0f9ff 0%, #fef2f2 100%)";
                    e.currentTarget.style.borderColor = "#3b82f6";
                    
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      const fileName = file.name;
                      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

                      if (isExcel) {
                        // XLSX 파일 처리
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const data = event.target.result;
                            const workbook = XLSX.read(data, { type: "array" });
                            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                            
                            if (!jsonData || jsonData.length === 0) {
                              setCsvError("Excel 파일에 데이터가 없습니다.");
                              setStudents([]);
                              setUploadedFileName("");
                              return;
                            }
                            // 고유 ID 추가
                            const processedStudents = addUniqueIdsToStudents(jsonData);
                            setStudents(processedStudents);
                            setUploadedFileName(fileName);
                            setCsvError("");
                          } catch (error) {
                            setCsvError("Excel 파일을 읽는 중 오류가 발생했습니다.");
                            setUploadedFileName("");
                          }
                        };
                        reader.readAsArrayBuffer(file);
                      } else {
                        // CSV 파일 처리
                        Papa.parse(file, {
                          header: true,
                          skipEmptyLines: true,
                          complete: (results) => {
                            if (!results.data || results.data.length === 0) {
                              setCsvError("CSV 파일에 데이터가 없습니다.");
                              setStudents([]);
                              setUploadedFileName("");
                              return;
                            }
                            // 고유 ID 추가
                            const processedStudents = addUniqueIdsToStudents(results.data);
                            setStudents(processedStudents);
                            setUploadedFileName(file.name);
                            setCsvError("");
                          },
                          error: () => {
                            setCsvError("CSV 파일을 읽는 중 오류가 발생했습니다.");
                            setUploadedFileName("");
                          },
                        });
                      }
                    }
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#1e40af", marginBottom: 4 }}>
                    여기에 파일을 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                    지원 형식: CSV (.csv) 또는 Excel (.xlsx, .xls)
                  </p>
                  <label style={{
                    display: "inline-block",
                    padding: "14px 28px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#fff",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
                  }}>
                    📂 파일 선택
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const fileName = file.name;
                        const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

                        if (isExcel) {
                          // XLSX 파일 처리
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const data = event.target.result;
                              const workbook = XLSX.read(data, { type: "array" });
                              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                              const jsonData = XLSX.utils.sheet_to_json(worksheet);
                              
                              if (!jsonData || jsonData.length === 0) {
                                setCsvError("Excel 파일에 데이터가 없습니다.");
                                setStudents([]);
                                setUploadedFileName("");
                                return;
                              }
                              // 고유 ID 추가
                              const processedStudents = addUniqueIdsToStudents(jsonData);
                              setStudents(processedStudents);
                              setUploadedFileName(fileName);
                              setCsvError("");
                            } catch (error) {
                              setCsvError("Excel 파일을 읽는 중 오류가 발생했습니다.");
                              setUploadedFileName("");
                            }
                          };
                          reader.readAsArrayBuffer(file);
                        } else {
                          // CSV 파일 처리 (기존 방식)
                          Papa.parse(file, {
                            header: true,
                            skipEmptyLines: true,
                            complete: (results) => {
                              if (!results.data || results.data.length === 0) {
                                setCsvError("CSV 파일에 데이터가 없습니다.");
                                setStudents([]);
                                setUploadedFileName("");
                                return;
                              }
                              // 고유 ID 추가
                              const processedStudents = addUniqueIdsToStudents(results.data);
                              setStudents(processedStudents);
                              setUploadedFileName(file.name);
                              setCsvError("");
                            },
                            error: () => {
                              setCsvError("CSV 파일을 읽는 중 오류가 발생했습니다.");
                              setUploadedFileName("");
                            },
                          });
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              )}
            </div>

            {csvError && <div style={err}><span>⚠️</span><span>{csvError}</span></div>}

            {/* 샘플 파일 다운로드 섹션 - 하단 */}
            {!uploadedFileName && (
              <div style={{ marginTop: 24, padding: "16px", background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", borderRadius: 12, border: "2px solid #ddd6fe" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <span style={{ fontWeight: 700, color: "#6b21a8", fontSize: 13 }}>처음 사용하시는거라면?</span>
                </div>
                <p style={{ fontSize: 12, color: "#7c3aed", marginBottom: 12, lineHeight: 1.6 }}>
                  앱의 기능을 먼저 테스트해보려면 아래 샘플 파일을 다운로드하여 업로드해보세요.
                </p>
                <a
                  href="https://github.com/getbetterwithme/comment-generator/raw/main/1학년 생활기록부 기초자료 조사(응답샘플).xlsx"
                  download
                  style={{
                    display: "inline-block",
                    padding: "8px 14px",
                    background: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
                    color: "#fff",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 12,
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = "0 4px 12px rgba(168, 85, 247, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  📥 샘플 파일 다운로드
                </a>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={btnOutline} onClick={() => setStep(1)}>
                ← 이전
              </button>
              <button
                style={btn}
                onClick={() => {
                  if (!students.length) {
                    setCsvError("학생 데이터가 아직 불러와지지 않았습니다.");
                    return;
                  }
                  setStep(3);
                }}
              >
                {uploadedFileName ? "다음 단계로 →" : "불러오기 →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 list */}
        {step === 3 && !selectedStudent && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 32 }}>👥</div>
              <h2 style={h2}>3단계. 학생 목록</h2>
            </div>
            <p style={desc}>
              <span style={{ fontWeight: 700, color: "#667eea" }}>🎯 학생을 선택하여 종합의견을 생성하세요.</span>
            </p>

            <div style={listBox}>
              {students.length === 0 ? (
                <div style={{ padding: 12, color: "#667085" }}>불러온 학생이 없습니다.</div>
              ) : (
                students.map((s, idx) => {
                  const studentId = s["_id"]; // 고유 ID 사용
                  const isSelected = !!finalSelections[studentId];
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedStudent(s);
                        // Q항목과 특성은 이미 전역 상태에서 관리되므로 복원할 필요 없음
                      }}
                      style={{
                        padding: "16px 20px",
                        cursor: "pointer",
                        borderTop: idx === 0 ? "none" : "1px solid #e5e7ef",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: isSelected ? "#f0fdf4" : "#fff",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isSelected ? "#dcfce7" : "#f8f9ff";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSelected ? "#f0fdf4" : "#fff";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{isSelected ? "✅" : "👤"}</span>
                        <span style={{ fontWeight: 800, fontSize: 16, color: "#1a202c" }}>{s["이름"] || "이름 없음"}</span>
                        {isSelected && (
                          <span style={{ 
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#fff",
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700
                          }}>
                            선택완료
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>학번: {s["학번 네자리"] || "-"}</span>
                        <span style={{ fontSize: 18 }}>→</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btnOutline} onClick={() => setStep(2)}>
                ← 이전
              </button>
              {Object.keys(finalSelections).length > 0 && (
                <button 
                  style={{
                    ...btn,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                  }}
                  onClick={exportToCSV}
                >
                  📥 CSV 내보내기 ({Object.keys(finalSelections).length}명)
                </button>
              )}
              {!hasKey && (
                <button style={btnOutline} onClick={openSettings}>
                  API 키 설정
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3 detail */}
        {step === 3 && selectedStudent && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 32 }}>🎓</div>
              <h2 style={h2}>
                학생 상세 – {selectedStudent["이름"] || "이름 없음"} ({selectedStudent["학번 네자리"] || "-"})
              </h2>
            </div>
            <p style={desc}>
              <span style={{ fontWeight: 700, color: "#667eea" }}>📋 학생이 작성한 설문 응답 검토</span>
              <br />
              <span style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8, marginTop: 8, display: "block" }}>
                아래 Q1~Q11 항목 중에서 학생의 성장, 역량, 인성을 드러내는 <strong style={{ color: "#334155" }}>실질적 내용</strong>을 판단하고, 
                종합의견에 <strong style={{ color: "#334155" }}>반영할 만한 가치가 있는 항목만 체크</strong>해주세요.
                <br />
                일반적이거나 추상적인 표현, 주변 학생과 구별되지 않는 답변은 <strong style={{ color: "#dc2626" }}>체크 해제</strong> 상태로 두시면 됩니다.
              </span>
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              {qEntries.map(([k, v]) => {
                const studentId = selectedStudent["_id"]; // 고유 ID 사용
                const studentQItems = selectedQItems[studentId] || {};
                const isQSelected = studentQItems[k] === true; // 기본값은 false (체크 안됨, 명시적으로 true일 때만 선택됨)
                return (
                  <div 
                    key={k} 
                    style={{
                      ...qaBox, 
                      background: isQSelected ? "#f0fdf4" : "#fafbfc",
                      borderColor: isQSelected ? "#86efac" : "#e6e9f2",
                      opacity: isQSelected ? 1 : 0.7,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      const studentId = selectedStudent["_id"]; // 고유 ID 사용
                      setSelectedQItems(prev => {
                        const studentQItems = prev[studentId] || {};
                        return {
                          ...prev,
                          [studentId]: {
                            ...studentQItems,
                            [k]: studentQItems[k] === true ? false : true // toggle
                          }
                        };
                      });
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          border: `2px solid ${isQSelected ? "#16a34a" : "#d1d5db"}`,
                          background: isQSelected ? "#16a34a" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {isQSelected && "✓"}
                        </div>
                        <span style={{ fontWeight: 900, color: "#667eea", fontSize: 15 }}>{k}</span>
                      </div>
                    </div>
                    <div style={{ whiteSpace: "pre-line", color: "#334155", lineHeight: 1.7, paddingLeft: 26 }}>{v || "(응답 없음)"}</div>
                  </div>
                );
              })}
            </div>

            {/* Q 항목 선택 요약 */}
            {(() => {
              const studentId = selectedStudent["_id"]; // 고유 ID 사용
              const studentQItems = selectedQItems[studentId] || {};
              const selectedCount = qEntries.filter(([k]) => studentQItems[k] === true).length;
              return selectedCount > 0 && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, border: "2px solid #86efac" }}>
                  <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                    ✓ {selectedCount}개 항목이 종합의견 생성에 반영됩니다
                  </div>
                </div>
              );
            })()}

            {/* 학생 특성 선택 */}
            <div style={{ marginTop: 24, padding: "24px", background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", borderRadius: 16, border: "2px solid #fbbf24" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>✨</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 17, color: "#92400e", marginBottom: 4 }}>학생의 특성 선택</div>
                  <div style={{ fontSize: 14, color: "#b45309" }}>이 중에 반영할 만한 실속있는 내용이 있는 것만 체크해주세요 (중복 선택 가능)</div>
                </div>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {studentTraits.map((trait) => {
                  const isSelected = selectedTraits.includes(trait);
                  return (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: isSelected ? "8px 20px" : "8px 20px",
                        borderRadius: 999,
                        border: "none",
                        background: isSelected 
                          ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" 
                          : "rgba(255, 255, 255, 0.9)",
                        color: isSelected ? "#fff" : "#374151",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: isSelected 
                          ? "0 4px 12px rgba(124, 58, 237, 0.3)" 
                          : "0 2px 8px rgba(0, 0, 0, 0.08)",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                        border: isSelected ? "none" : "2px solid #e5e7ef",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = isSelected ? "scale(1.08)" : "scale(1.02)";
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = isSelected ? "scale(1.05)" : "scale(1)";
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                        }
                      }}
                    >
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: isSelected ? "rgba(255,255,255,0.3)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                      }}>
                        {isSelected ? "✓" : ""}
                      </div>
                      {trait}
                    </button>
                  );
                })}
              </div>

              {selectedTraits.length > 0 && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255, 255, 255, 0.8)", borderRadius: 12, border: "2px solid rgba(124, 58, 237, 0.3)" }}>
                  <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>
                    ✨ 선택된 특성 ({selectedTraits.length}개): {selectedTraits.join(", ")}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button
                style={btnOutline}
                onClick={() => {
                  setSelectedStudent(null);
                  setGeneratedText(""); // 최신 결과만 초기화
                  setApiError("");
                  setSelectedTraits([]); // 특성 선택 초기화
                  // Q 항목은 초기화하지 않음 - 다시 학생 선택 시 복원됨
                }}
              >
                ← 목록으로 돌아가기
              </button>

              <button
                style={{
                  ...btn,
                  opacity: isGenerating || !hasKey ? 0.55 : 1,
                  cursor: isGenerating || !hasKey ? "not-allowed" : "pointer",
                }}
                disabled={isGenerating || !hasKey}
                onClick={async () => {
                  // 선택된 Q 항목만 필터링 (학생별)
                  const studentId = selectedStudent["_id"]; // 고유 ID 사용
                  const studentQItems = selectedQItems[studentId] || {};
                  const selectedQEntries = qEntries.filter(([k]) => studentQItems[k] === true);
                  
                  if (selectedQEntries.length === 0) {
                    setApiError("⚠️ 최소 1개 이상의 항목을 선택해주세요.");
                    return;
                  }
                  
                  const studentText = selectedQEntries.map(([k, v]) => `${k}: ${v}`).join("\n\n");
                  const traitsText = selectedTraits.length > 0 
                    ? `\n\n## 교사가 관찰한 학생의 주요 특성:\n${selectedTraits.join(", ")}\n(위 특성들을 자연스럽게 반영하여 작성해주세요)`
                    : "";

                  const prompt = `# 명령

학생의 '행동특성 및 종합의견'을 교육부 기재 요령에 맞춰 **구체적이고 긍정적**으로 작성해주세요. 다음 지침을 엄수하세요.

1. **관찰 기반 서술:**
    - 추상적인 형용사 나열을 지양하고, 실제 수업·학교생활에서 관찰된 **구체적인 행동, 에피소드, 역할 수행 과정**을 중심으로 학생의 특성을 설명할 것.
    - 단순히 맡았던 역할을 나열하지 말고, 그 역할을 통해 **무엇을 어떻게 했는지**, 그 과정에서 드러난 인성과 역량을 드러낼 것.
2. **성장 중심 기록:**
    - 학생의 인성(나눔, 배려, 협력, 갈등 관리 등)과 핵심 역량이 드러나도록 서술할 것.
    - 보완이 필요한 부분은 '~한 노력을 통해 개선됨', '~을 보완한다면 발전이 기대됨'처럼 **긍정적 피드백과 성장 가능성**에 초점을 맞춰 기술할 것.
    - **중요: 상급학교(고등학교) 진학 후 성장 가능성이나 미래 예측은 절대 금지. 현재 중학교 1학년 시점의 관찰 내용만 기술할 것.**
3. **학업 태도 및 진로·학업 역량:**
    - 단순 성적보다 **자기주도적 학습 태도, 지적 호기심, 탐구 과정**을 중심으로 서술할 것.
    - 학생이 보인 학업 태도와 성취를 바탕으로, **현재의 학업 역량**을 구체적 상황이나 사례와 함께 제시할 것.
4. **학생 자기설문(CSV) 기반 작성 원칙:**
    - 입력으로 제공되는 **CSV 파일은 학생이 1년간의 학교생활, 학업, 성장, 대인관계 등에 대해 스스로 작성한 설문 결과임.**
    - 작성 시, **반드시 이 CSV에 담긴 학생의 자기서술 내용을 1차 근거로 삼아** 문장을 구성할 것.
    - CSV에 **명시적으로 등장하지 않거나, 논리적으로 추론하기 어려운 내용은 임의로 만들어 쓰지 말 것.**
        - 예) CSV에 봉사활동, 동아리, 특정 진로 희망이 전혀 언급되지 않았다면, 해당 활동이나 진로를 단정적으로 서술하지 말 것.
    - CSV 내용과 교사의 관찰을 결합할 수 있으나, **학생의 진술과 모순되거나 전혀 관련이 없는 엉뚱한 서술은 원천적으로 금지함.**
    - 특정 항목에 대한 정보가 CSV에 전혀 없을 경우, 무리하게 상상하거나 일반적인 미사여구로 채우지 말고, **다른 관찰 가능한 영역(학업 태도, 수업 참여, 또래 관계 등)을 중심으로 균형 있게 기술**할 것.

# 페르소나

당신은 중학교 1학년 담임 및 교과를 맡은 **베테랑 교사**입니다.

학생과 깊은 신뢰 관계를 형성하고, 개개인의 성장과 발전을 중요하게 생각하는 교육자로서, 학생의 사소한 장점도 놓치지 않고 발견하여 학부모나 교과 담당 교사가 학생의 **현재 모습과 강점**을 파악할 수 있도록 설득력 있게 기록합니다. 관찰에 기반한 객관적인 시선을 유지하되, 따뜻하고 성장을 돕는 태도로 서술합니다. 특히 학생이 직접 작성한 자기설문 내용을 존중하고, 이를 토대로 학생의 목소리가 드러나는 기록을 남깁니다.

# 형식 및 어조

1. **문장 구성:**
    - 한 문장은 **100자 이내**로 작성하고, 만연체를 피할 것.
    - 모든 문장을 명확히 구분하여 마침표(.)로 끝낼 것.
2. **종결 어미:**
    - 객관성과 신뢰도를 높이기 위해 **명사형 어미(∼함, ∼임)**으로 문장을 마무리할 것.
    - 다만 지나치게 딱딱하지 않도록 자연스러운 흐름을 유지할 것.
3. **시제:**
    - **현재형 위주**로 작성하여 현재 관찰 중인 학생의 모습을 기술할 것.
    - "현재 보이는", "이번 학년에", "최근 관찰되는" 같은 표현 사용.
    - **절대 금지**: "고등학교에서", "상급학교에서", "앞으로", "향후", "나중에" 같은 미래 시제 표현.
4. **분량:**
    - 공백 포함 **500자 이내의 한 문단**으로 작성할 것.
5. **금지 사항:**
    - '학생 A', '그는' 등 **주어 표현을 쓰지 말 것**.
    - 미사여구 위주의 추상적 표현과 역할·활동의 단순 나열 금지.
    - CSV와 무관한 내용, 학생의 진술과 상반되거나 확인 불가능한 추측성 표현, 일반적인 칭찬 문구의 기계적 나열 금지.
    - **상급학교나 미래 예측 관련 표현 금지** (예: "성장이 기대됨", "발전할 것으로 예상됨" 등은 현재 관찰 내용으로만 제한)

# 스타일 예시 (이 스타일을 따를 것)

평소 명랑하고 긍정적인 태도로 주변 분위기를 밝게 이끄는 모습이 돋보임. 이해가 어려운 내용이 있을 때 친구들과 토론하거나 추가 자료를 찾아보며 스스로 해결 방안을 모색하는 자기주도적 학습 태도가 안정적으로 형성되어 있음. 학급에서 맡은 역할을 수행하며 과제 안내와 토론 활동을 성실히 준비하고 진행하여 또래들이 수업에 적극적으로 참여할 수 있도록 돕는 과정에서 책임감과 협업 능력이 잘 드러남. 낯선 과제 앞에서 처음에는 부담을 느끼는 모습을 보이나, 구체적인 목표를 세우고 일정에 맞춰 실천하려는 노력을 통해 끝까지 완수하려는 끈기와 성실성이 점차 강화되고 있음. 교내외 봉사활동과 학교 행사 참여에서 주변을 세심하게 살피고 도움을 주려는 태도가 꾸준히 관찰되며, 이러한 경험을 바탕으로 타인을 배려하는 품성과 공동체의식이 더욱 성장할 것으로 기대됨.

---

## 교사 문체 학습 및 반영 (매우 중요):

아래는 **이 선생님이 실제로 과거에 작성한 종합의견 예시**입니다. 새로운 종합의견을 작성할 때, 이 예시들의 **문체, 어조, 문장 구조, 표현 방식을 면밀히 분석하여 동일한 스타일로 작성**해야 합니다.

### 분석해야 할 글쓰기 패턴:
1. **문장 길이와 리듬**: 짧고 간결한 문장을 선호하는지, 길고 상세한 문장을 선호하는지
2. **어휘 선택**: 어떤 형용사와 부사를 자주 사용하는지 (예: "성실하게", "적극적으로", "꾸준히" 등)
3. **문장 종결 어미**: 명사형 어미(~함, ~임)의 사용 빈도와 패턴
4. **내용 전개 순서**: 학업 → 인성 → 성장 순서인지, 다른 구조인지
5. **구체성 수준**: 일반적 표현을 쓰는지, 매우 구체적인 에피소드를 쓰는지
6. **긍정적 표현 방식**: 보완점을 어떻게 긍정적으로 전환하는지

### 선생님의 종합의견 예시:
${styleSamples.map((sample, idx) => sample.text ? `[종합의견 예시 ${idx + 1}]\n${sample.text}` : "").filter(Boolean).join("\n\n")}
${styleSamples.filter(s => s.text).length === 0 ? "(제공된 예시 없음 - 일반적인 생기부 작성 스타일로 작성)" : ""}

### 작성 시 주의사항:
- ✅ **DO**: 위 예시들과 동일한 어조, 문체, 표현 방식을 사용할 것
- ✅ **DO**: 선생님이 선호하는 어휘와 문장 구조를 그대로 따를 것
- ✅ **DO**: 같은 선생님이 작성한 것처럼 일관된 스타일을 유지할 것
- ❌ **DON'T**: 예시의 문장을 그대로 복사하지 말 것
- ❌ **DON'T**: 예시와 전혀 다른 어조나 문체를 사용하지 말 것

---

## 학생 자기평가 설문 응답 (Q1~Q11):
${studentText}
${traitsText}

---

위 지침과 학생의 자기평가 설문 내용을 바탕으로 '행동특성 및 종합의견'을 작성해주세요.

**작성 시 필수 요구사항:**
- 분량: **400자 이상 500자 이내**의 한 문단 (공백 포함)
- 너무 짧지 않도록 구체적인 사례와 관찰 내용을 충분히 포함할 것
- 학생의 자기설문 내용을 1차 근거로 삼아 다양한 관점에서 서술할 것
- 학업, 인성, 사회성 등 여러 영역을 균형있게 다룰 것

**⚠️ 글자수 관리 (중요):**
- 반영할 내용이 많은 경우, 교육전문가로서 우선순위를 판단하여 작성할 것
- 학생의 성장, 역량, 인성을 가장 잘 보여주는 내용을 중심으로 선정할 것
- 덜 중요한 내용은 생략하거나 축약하여 500자를 넘지 않도록 조정할 것
- 의도적으로 글자수를 초과하지 말 것`;

                  setIsGenerating(true);
                  setApiError("");
                  setGeneratedText("");

                  try {
                    const result = await generateWithLLM(prompt);
                    const charCount = result.length;
                    
                    // 글자수 정보 표시만 함 (강제 제한 없음)
                    if (charCount < 400) {
                      setApiError(`⚠️ 참고: ${charCount}자로 400자 미만입니다. 가능하면 더 자세한 내용을 추가해주세요.`);
                    } else if (charCount > 500) {
                      setApiError(`ℹ️ 참고: ${charCount}자로 500자를 초과했습니다. 필요시 내용을 수정해주세요.`);
                    } else {
                      setApiError(""); // 정상 범위면 메시지 제거
                    }
                    
                    setGeneratedText(result);
                    
                    // 생성 이력에 추가 (API 정보 포함)
                    const studentId = selectedStudent["_id"]; // 고유 ID 사용
                    setGenerationHistory(prev => ({
                      ...prev,
                      [studentId]: [
                        { 
                          text: result, 
                          timestamp: new Date().toLocaleString('ko-KR'),
                          apiProvider: apiProvider.toUpperCase(),
                          apiModel: apiModel
                        },
                        ...(prev[studentId] || [])
                      ]
                    }));
                  } catch (e) {
                    setApiError(e?.message || "오류가 발생했습니다.");
                  } finally {
                    setIsGenerating(false);
                  }
                }}
              >
                {isGenerating ? "⏳ 생성 중…" : (
                  (() => {
                    const studentId = selectedStudent["학번 네자리"] || selectedStudent["이름"] || "";
                    const historyCount = generationHistory[studentId]?.length || 0;
                    return historyCount > 0 ? "🔄 다시 생성하기 (새로운 의견 생성)" : "✨ 종합의견 생성";
                  })()
                )}
              </button>

              {!hasKey && (
                <button style={btnOutline} onClick={openSettings}>
                  키 설정 후 생성
                </button>
              )}
            </div>

            {apiError && <div style={err}><span>⚠️</span><span>{apiError}</span></div>}

            {generatedText && (
              <div style={{ marginTop: 20, padding: 20, background: "linear-gradient(135deg, #f6f8ff 0%, #fff5f7 100%)", borderRadius: 16, border: "2px solid #e0e7ff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🎉</span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: "#667eea" }}>최신 생성 결과</span>
                    {(() => {
                      const studentId = selectedStudent["_id"]; // 고유 ID 사용
                      const isFinalSelected = finalSelections[studentId] === generatedText;
                      if (isFinalSelected) {
                        return (
                          <span style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#fff",
                            padding: "6px 14px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 700,
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
                          }}>
                            ⭐ 최종선택됨
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ 
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#374151"
                    }}>
                      🤖 {apiProvider.toUpperCase()} • {apiModel}
                    </div>
                    <div style={{ 
                      background: "#f0fdf4",
                      border: "2px solid #86efac",
                      borderRadius: 999,
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#16a34a"
                    }}>
                      📝 {generatedText.length}자
                    </div>
                    <button
                      style={{
                        ...btn,
                        padding: "6px 14px",
                        fontSize: 13,
                      }}
                      onClick={() => {
                        const studentId = selectedStudent["_id"]; // 고유 ID 사용
                        selectFinalOpinion(studentId, generatedText);
                        alert("✅ 이 의견이 최종 선택되었습니다!");
                      }}
                    >
                      ⭐ 최종 선택
                    </button>
                  </div>
                </div>
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={10}
                  style={ta}
                />
              </div>
            )}

            {/* 생성 이력 */}
            {(() => {
              const studentId = selectedStudent["_id"]; // 고유 ID 사용
              const history = generationHistory[studentId] || [];
              
              if (history.length > 0) {
                return (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 22 }}>📚</span>
                      <span style={{ fontWeight: 900, fontSize: 18, color: "#1a202c" }}>생성 이력 ({history.length}개)</span>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {history.map((item, idx) => {
                        const studentId = selectedStudent["_id"]; // 고유 ID 사용
                        const isFinalSelected = finalSelections[studentId] === item.text;
                        
                        return (
                          <div key={idx} style={{ 
                            background: "#fff", 
                            border: isFinalSelected ? "3px solid #10b981" : "2px solid #e6e9f2",
                            borderRadius: 16, 
                            padding: 20,
                            boxShadow: isFinalSelected ? "0 4px 16px rgba(16, 185, 129, 0.2)" : "0 2px 8px rgba(0,0,0,0.05)",
                            position: "relative"
                          }}>
                            {isFinalSelected && (
                              <div style={{
                                position: "absolute",
                                top: -12,
                                right: 20,
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#fff",
                                padding: "6px 16px",
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 700,
                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
                              }}>
                                ⭐ 최종선택됨
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10, marginTop: isFinalSelected ? 10 : 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ 
                                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                                  color: "#fff", 
                                  padding: "4px 12px", 
                                  borderRadius: 999, 
                                  fontSize: 13, 
                                  fontWeight: 700 
                                }}>
                                  #{history.length - idx}
                                </span>
                                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                                  🕐 {item.timestamp}
                                </span>
                                <span style={{ 
                                  background: "#f3f4f6",
                                  border: "1px solid #d1d5db",
                                  borderRadius: 6,
                                  padding: "4px 10px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#374151"
                                }}>
                                  🤖 {item.apiProvider || "UNKNOWN"} • {item.apiModel || "-"}
                                </span>
                                <span style={{ 
                                  background: "#f0fdf4",
                                  border: "2px solid #86efac",
                                  borderRadius: 999,
                                  padding: "4px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#16a34a"
                                }}>
                                  📝 {item.text.length}자
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  style={{
                                    ...btn,
                                    padding: "8px 14px",
                                    fontSize: 13,
                                    opacity: isFinalSelected ? 0.6 : 1,
                                  }}
                                  onClick={() => {
                                    const studentId = selectedStudent["_id"]; // 고유 ID 사용
                                    selectFinalOpinion(studentId, item.text);
                                    alert("✅ 이 의견이 최종 선택되었습니다!");
                                  }}
                                >
                                  ⭐ 최종 선택
                                </button>
                                <button
                                  style={{
                                    ...btnOutline,
                                    padding: "8px 14px",
                                    fontSize: 13,
                                  }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.text).then(() => {
                                      alert("📋 클립보드에 복사되었습니다!");
                                    }).catch(() => {
                                      alert("❌ 복사에 실패했습니다.");
                                    });
                                  }}
                                >
                                  📋 복사
                                </button>
                              </div>
                            </div>
                            <div style={{ 
                              whiteSpace: "pre-line", 
                              color: "#334155", 
                              lineHeight: 1.7,
                              fontSize: 15,
                              padding: "12px",
                              background: "#f8f9fa",
                              borderRadius: 12,
                              maxHeight: "200px",
                              overflowY: "auto"
                            }}>
                              {item.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Settings modal */}
        {isSettingsOpen && (
          <div style={modalBackdrop} onMouseDown={() => setIsSettingsOpen(false)}>
            <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 24 }}>⚙️</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#1a202c" }}>API 설정</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🔐</span>
                    <span>API 키는 이 브라우저에만 저장됩니다(로컬 저장). 필요하면 언제든 삭제할 수 있습니다.</span>
                  </div>
                </div>
                <button style={xBtn} onClick={() => setIsSettingsOpen(false)}>
                  ✕
                </button>
              </div>

              {/* Provider selection */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: "#1a202c", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🤖</span>
                  <span>LLM 제공자 선택</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.keys(providerConfigs).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleProviderChange(provider)}
                      style={{
                        ...providerBtn,
                        background: apiProvider === provider ? "#111827" : "#fff",
                        color: apiProvider === provider ? "#fff" : "#111827",
                        borderColor: apiProvider === provider ? "#111827" : "#d8deea",
                      }}
                    >
                      {provider.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: "#1a202c", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🔑</span>
                  <span>API 키</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="API 키를 입력하세요"
                    style={input}
                  />
                  <button style={btnOutline} onClick={() => setShowKey((v) => !v)}>
                    {showKey ? "숨김" : "표시"}
                  </button>
                </div>
              </div>

              {/* API Endpoint */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: "#1a202c", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🌐</span>
                  <span>API 엔드포인트</span>
                </div>
                <input
                  type="text"
                  value={apiEndpointInput}
                  onChange={(e) => setApiEndpointInput(e.target.value)}
                  placeholder="예: https://api.openai.com/v1/chat/completions"
                  style={input}
                />
                <div style={{ fontSize: 12, color: "#667085", marginTop: 6 }}>
                  선택한 제공자의 기본값이 자동 입력됩니다. 필요시 수정하세요.
                </div>
              </div>

              {/* Model */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: "#1a202c", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🎯</span>
                  <span>모델명</span>
                </div>
                <input
                  type="text"
                  value={apiModelInput}
                  onChange={(e) => setApiModelInput(e.target.value)}
                  placeholder="예: gpt-4o-mini"
                  style={input}
                />
                <div style={{ fontSize: 12, color: "#667085", marginTop: 6 }}>
                  선택한 제공자의 기본 모델명이 자동 입력됩니다. 필요시 수정하세요.
                </div>
              </div>

              {/* Help text */}
              <div style={{ marginTop: 20, padding: 16, background: "linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)", borderRadius: 12, border: "2px solid #ddd6fe" }}>
                <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.7, fontWeight: 600 }}>
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, color: "#667eea" }}>
                    <span>📌</span>
                    <span>각 제공자별 설정</span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>OpenAI:</strong> API 키는 sk-... 형식
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Claude:</strong> API 키는 sk-ant-... 형식
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Gemini:</strong> Google AI Studio에서 발급받은 API 키. 모델명은 <code style={{ background: "#fff", padding: "2px 4px", borderRadius: 4 }}>gemini-2.0-flash</code> 같은 형식
                  </div>
                  <div>
                    <strong>Custom:</strong> 자신의 LLM 서버나 프록시 사용 가능
                  </div>
                </div>
              </div>

              {apiError && <div style={{ ...err, marginTop: 20 }}><span>⚠️</span><span>{apiError}</span></div>}

              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                <button
                  style={{ ...btn, opacity: apiKeyInput.trim() && apiEndpointInput.trim() && apiModelInput.trim() ? 1 : 0.5 }}
                  disabled={!apiKeyInput.trim() || !apiEndpointInput.trim() || !apiModelInput.trim()}
                  onClick={saveSettings}
                >
                  💾 저장
                </button>
                <button style={btnOutline} onClick={clearSettings}>
                  🗑️ 설정 삭제
                </button>
                <button style={btnOutline} onClick={() => setIsSettingsOpen(false)}>
                  ✕ 닫기
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />

        {/* Custom Alert */}
        {customAlert.show && (
          <div style={modalBackdrop} onClick={() => setCustomAlert({ show: false, message: "" })}>
            <div 
              style={{
                ...modal,
                maxWidth: "500px",
                textAlign: "center",
                animation: "slideIn 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>
                {customAlert.message.includes("✅") ? "✅" : "❌"}
              </div>
              <div style={{ 
                whiteSpace: "pre-line", 
                fontSize: 15, 
                lineHeight: 1.8, 
                color: "#334155",
                marginBottom: 24,
                fontWeight: 500,
              }}>
                {customAlert.message}
              </div>
              <button
                onClick={() => setCustomAlert({ show: false, message: "" })}
                style={{
                  ...btn,
                  width: "100%",
                  padding: "12px 24px",
                  fontSize: 15,
                }}
              >
                확인
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

/* --- styles --- */
const topBar = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  marginBottom: 24,
  background: "rgba(255, 255, 255, 0.95)",
  padding: "24px 32px",
  borderRadius: 24,
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
  backdropFilter: "blur(10px)",
  flexWrap: "wrap",
};

const card = {
  background: "#fff",
  border: "none",
  borderRadius: 24,
  padding: "32px",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  minHeight: "500px",
};

const listBox = {
  border: "2px solid #e5e7ef",
  borderRadius: 16,
  overflow: "hidden",
  background: "#fafbfc",
};

const h2 = { fontSize: 24, fontWeight: 800, marginBottom: 12, color: "#1a202c" };
const desc = { fontSize: 15, color: "#718096", marginBottom: 20, lineHeight: 1.6 };

const ta = {
  width: "100%",
  border: "2px solid #e6e9f2",
  borderRadius: 16,
  padding: "16px",
  outline: "none",
  fontSize: 15,
  lineHeight: 1.6,
  marginTop: 12,
  background: "#fafbfc",
  fontFamily: "'Segoe UI', 'Apple SD Gothic Neo', sans-serif",
  transition: "all 0.2s",
  boxSizing: "border-box",
  resize: "vertical",
};

const input = {
  width: "100%",
  border: "2px solid #e6e9f2",
  borderRadius: 12,
  padding: "14px 16px",
  outline: "none",
  fontSize: 15,
  background: "#fafbfc",
  transition: "all 0.2s",
  boxSizing: "border-box",
};

const btn = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  border: "none",
  padding: "14px 28px",
  borderRadius: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 15,
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  transition: "all 0.3s",
  transform: "translateY(0)",
};

const btnOutline = {
  background: "#fff",
  color: "#667eea",
  border: "2px solid #667eea",
  padding: "14px 28px",
  borderRadius: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 15,
  transition: "all 0.3s",
};

const providerBtn = {
  border: "2px solid",
  borderRadius: 12,
  padding: "14px 20px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.3s",
  fontSize: 14,
};

const qaBox = {
  border: "2px solid #e6e9f2",
  borderRadius: 16,
  padding: "20px",
  background: "#fafbfc",
  transition: "all 0.2s",
};

const pill = {
  background: "rgba(255, 255, 255, 0.9)",
  border: "2px solid #e6e9f2",
  borderRadius: 999,
  padding: "10px 16px",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  fontWeight: 600,
};

const err = {
  marginTop: 16,
  padding: "14px 16px",
  borderRadius: 12,
  background: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
  border: "2px solid #fecaca",
  color: "#dc2626",
  fontSize: 14,
  lineHeight: 1.6,
  fontWeight: 600,
  display: "flex",
  alignItems: "start",
  gap: 8,
};

const modalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const modal = {
  width: "min(800px, 96vw)",
  background: "#fff",
  borderRadius: 24,
  border: "none",
  boxShadow: "0 25px 80px rgba(0, 0, 0, 0.3)",
  padding: "32px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const xBtn = {
  background: "#fff",
  border: "1px solid #e6e9f2",
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 900,
  cursor: "pointer",
};