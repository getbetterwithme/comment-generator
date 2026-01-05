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
    const savedStyleSamples = localStorage.getItem("STYLE_SAMPLES");
    
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
    
    // 종합의견 예시 로드
    if (savedStyleSamples) {
      try {
        const parsed = JSON.parse(savedStyleSamples);
        setStyleSamples(parsed);
        // nextId도 복원
        const maxId = Math.max(...parsed.map(s => s.id), 0);
        setNextId(maxId + 1);
      } catch (e) {
        console.error("종합의견 예시 로드 실패:", e);
      }
    }
    
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

  // styleSamples 변경 시 저장
  useEffect(() => {
    localStorage.setItem("STYLE_SAMPLES", JSON.stringify(styleSamples));
  }, [styleSamples]);

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

  // ✨ 추가: 최종 의견이 변경되면 누적 목록의 최신 항목도 업데이트
  useEffect(() => {
    if (!selectedStudent || !generatedText) return;
    
    const studentId = selectedStudent._id;
    const history = generationHistory[studentId] || [];
    
    if (history.length > 0) {
      const lastIndex = history.length - 1;
      const lastItem = history[lastIndex];
      
      // 최종 의견과 마지막 누적 의견이 다르면 동기화
      if (lastItem.text !== generatedText) {
        const updatedHistory = [...history];
        updatedHistory[lastIndex] = { ...lastItem, text: generatedText };
        setGenerationHistory(prev => ({
          ...prev,
          [studentId]: updatedHistory
        }));
      }
    }
  }, [generatedText, selectedStudent]);

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

  // ✨ 추가: 누적 목록의 특정 항목 수정
  const updateHistoryItem = (studentId, index, newText) => {
    setGenerationHistory(prev => {
      const history = prev[studentId] || [];
      const updatedHistory = [...history];
      updatedHistory[index] = { ...updatedHistory[index], text: newText };
      
      // 만약 마지막 항목이 수정되었다면 최종 의견도 업데이트
      if (index === history.length - 1) {
        setGeneratedText(newText);
      }
      
      return {
        ...prev,
        [studentId]: updatedHistory
      };
    });
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
      const opinion = finalSelections[student._id];
      if (opinion) {
        const charCount = opinion.length;
        // CSV 포맷 (쌍따옴표로 감싸고 내부 쌍따옴표는 이스케이프)
        const escapedOpinion = `"${opinion.replace(/"/g, '""')}"`;
        csv += `${student.학번},${student.이름},${escapedOpinion},${charCount}\n`;
      }
    });

    // 다운로드
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `생활기록부_종합의견_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCustomAlert({
      show: true,
      message: `✅ CSV 파일이 다운로드되었습니다!\n\n총 ${Object.keys(finalSelections).length}명의 종합의견이 포함되었습니다.`
    });
  };

  // 엑셀 내보내기
  const exportToExcel = () => {
    if (Object.keys(finalSelections).length === 0) {
      alert("⚠️ 선택된 종합의견이 없습니다. 먼저 학생별로 의견을 선택해주세요.");
      return;
    }

    // 데이터 준비
    const data = students
      .filter(student => finalSelections[student._id])
      .map(student => ({
        "학번": student.학번,
        "이름": student.이름,
        "종합의견": finalSelections[student._id],
        "글자수": finalSelections[student._id].length
      }));

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(data);
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 10 },  // 학번
      { wch: 10 },  // 이름
      { wch: 80 },  // 종합의견
      { wch: 10 }   // 글자수
    ];

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "종합의견");

    // 파일 다운로드
    XLSX.writeFile(wb, `생활기록부_종합의견_${new Date().toISOString().split('T')[0]}.xlsx`);

    setCustomAlert({
      show: true,
      message: `✅ 엑셀 파일이 다운로드되었습니다!\n\n총 ${Object.keys(finalSelections).length}명의 종합의견이 포함되었습니다.`
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

    if (ext === ".csv") {
      Papa.parse(file, {
        encoding: "EUC-KR",
        complete: (result) => {
          if (result.data && result.data.length > 0) {
            const studentsWithIds = addUniqueIdsToStudents(result.data);
            setStudents(studentsWithIds);
            setUploadedFileName(fileName);
            setCsvError("");
          } else {
            setCsvError("❌ CSV 파일이 비어있거나 형식이 올바르지 않습니다.");
          }
        },
        header: true,
        skipEmptyLines: true,
        error: () => {
          setCsvError("❌ CSV 파일을 읽는 중 오류가 발생했습니다.");
        },
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData && jsonData.length > 0) {
            const studentsWithIds = addUniqueIdsToStudents(jsonData);
            setStudents(studentsWithIds);
            setUploadedFileName(fileName);
            setCsvError("");
          } else {
            setCsvError("❌ 엑셀 파일이 비어있거나 형식이 올바르지 않습니다.");
          }
        } catch (err) {
          setCsvError("❌ 엑셀 파일을 읽는 중 오류가 발생했습니다.");
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setCsvError("❌ .csv 또는 .xlsx 파일만 업로드 가능합니다.");
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStep(3);
    
    // 해당 학생의 마지막 생성 이력이 있다면 표시
    const history = generationHistory[student._id];
    if (history && history.length > 0) {
      setGeneratedText(history[history.length - 1].text);
    } else {
      setGeneratedText("");
    }

    // 해당 학생의 Q항목 선택 상태 복원
    const studentQItems = selectedQItems[student._id] || {};
    // 기본적으로 모든 Q항목 선택
    const defaultQItems = {};
    Object.keys(student).filter(k => k.startsWith("Q")).forEach(k => {
      defaultQItems[k] = studentQItems[k] !== undefined ? studentQItems[k] : true;
    });
    setSelectedQItems(prev => ({
      ...prev,
      [student._id]: defaultQItems
    }));

    // 이전에 선택된 특성이 있다면 복원, 없으면 초기화
    setSelectedTraits([]);
  };

  const toggleQItem = (qKey) => {
    if (!selectedStudent) return;
    const studentId = selectedStudent._id;
    setSelectedQItems(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [qKey]: !prev[studentId]?.[qKey]
      }
    }));
  };

  const generateComment = async () => {
    if (!selectedStudent) return;
    if (!hasKey) {
      setApiError("❌ API 키가 설정되지 않았습니다. 우측 상단 설정 버튼을 눌러 API 키를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setApiError("");

    const studentQItems = selectedQItems[selectedStudent._id] || {};
    const selectedQs = qEntries.filter(([k]) => studentQItems[k]);

    const teacherSamples = styleSamples
      .filter(sample => sample.text.trim())
      .map((sample, idx) => `[예시 ${idx + 1}]\n${sample.text}`)
      .join("\n\n");

    const prompt = `당신은 중학교 교사입니다. 다음 학생 정보를 바탕으로 학생 생활기록부의 "행동특성 및 종합의견"란을 작성해주세요.

${teacherSamples ? `참고할 교사의 작성 스타일:
${teacherSamples}

**중요**: 위 샘플은 오직 문체, 어조, 표현 방식, 문장 구조, 어미 사용 패턴만 참고하세요. 샘플의 구체적인 내용(활동명, 특성, 사례 등)은 절대 사용하지 말고, 아래 제공된 학생의 정보만을 바탕으로 완전히 새로운 내용을 작성해주세요. 샘플은 "어떻게 쓸 것인가"에 대한 스타일 가이드일 뿐, "무엇을 쓸 것인가"에 대한 참고 자료가 아닙니다.` : ''}

학생 정보:
- 이름: ${selectedStudent.이름}
- 성별: ${selectedStudent.성별}

${selectedTraits.length > 0 ? `강조할 특성: ${selectedTraits.join(", ")}` : ''}

${selectedQs.length > 0 ? `학생 특이사항:
${selectedQs.map(([k, v]) => `• ${k}: ${v}`).join("\n")}` : ''}

작성 지침:
1. 학생의 긍정적인 면모와 성장 가능성을 중심으로 서술
2. 구체적인 사례나 행동을 바탕으로 작성 (위 학생 특이사항 참고)
3. 교육적이고 격려하는 어조 유지
4. 500-800자 분량으로 작성
5. 문단 구분 없이 하나의 연속된 텍스트로 작성
${teacherSamples ? '6. 제공된 샘플의 문체와 표현 방식을 따라 작성하되, 내용은 반드시 위 학생 정보만 활용' : ''}`;

    try {
      let response;
      
      if (apiProvider === "claude") {
        response = await fetch(currentEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: currentModel,
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
          }),
        });
      } else if (apiProvider === "gemini") {
        const geminiEndpoint = `${currentEndpoint}chat/completions`;
        response = await fetch(geminiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
          }),
        });
      } else {
        // OpenAI 또는 Custom
        response = await fetch(currentEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let generatedComment = "";

      if (apiProvider === "claude") {
        generatedComment = data.content?.[0]?.text || "";
      } else {
        generatedComment = data.choices?.[0]?.message?.content || "";
      }

      if (!generatedComment) {
        throw new Error("응답에서 생성된 텍스트를 찾을 수 없습니다.");
      }

      setGeneratedText(generatedComment);
      
      // 생성 이력에 추가
      const studentId = selectedStudent._id;
      const newHistory = {
        text: generatedComment,
        timestamp: new Date().toISOString()
      };
      
      setGenerationHistory(prev => ({
        ...prev,
        [studentId]: [...(prev[studentId] || []), newHistory]
      }));

    } catch (err) {
      setApiError(`❌ API 호출 실패: ${err.message}`);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCustomAlert({
        show: true,
        message: "✅ 클립보드에 복사되었습니다!"
      });
    });
  };

  const downloadAsText = (text, filename) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveSettings = () => {
    if (!apiKeyInput.trim() || !apiEndpointInput.trim() || !apiModelInput.trim()) {
      setApiError("❌ 모든 필드를 입력해주세요.");
      return;
    }

    localStorage.setItem("LLM_PROVIDER", apiProvider);
    localStorage.setItem("LLM_API_KEY", apiKeyInput.trim());
    localStorage.setItem("LLM_ENDPOINT", apiEndpointInput.trim());
    localStorage.setItem("LLM_MODEL", apiModelInput.trim());
    
    setApiKey(apiKeyInput.trim());
    setApiEndpoint(apiEndpointInput.trim());
    setApiModel(apiModelInput.trim());
    
    setCustomAlert({
      show: true,
      message: "✅ 설정이 저장되었습니다!"
    });
    setApiError("");
    setIsSettingsOpen(false);
  };

  const clearSettings = () => {
    if (window.confirm("⚠️ 저장된 모든 설정을 삭제하시겠습니까?")) {
      localStorage.removeItem("LLM_PROVIDER");
      localStorage.removeItem("LLM_API_KEY");
      localStorage.removeItem("LLM_ENDPOINT");
      localStorage.removeItem("LLM_MODEL");
      
      setApiProvider("openai");
      setApiKey("");
      setApiKeyInput("");
      setApiEndpoint(providerConfigs.openai.endpoint);
      setApiEndpointInput(providerConfigs.openai.endpoint);
      setApiModel(providerConfigs.openai.model);
      setApiModelInput(providerConfigs.openai.model);
      
      setCustomAlert({
        show: true,
        message: "✅ 설정이 초기화되었습니다."
      });
      setApiError("");
    }
  };

  const changeProvider = (provider) => {
    setApiProvider(provider);
    const config = providerConfigs[provider];
    setApiEndpointInput(config.endpoint);
    setApiModelInput(config.model);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px 20px",
        fontFamily: "'Segoe UI', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={topBar}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>📝</span>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#1a202c" }}>
              생활기록부 종합의견 생성기
            </h1>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {hasKey && (
              <div style={{ ...pill, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none" }}>
                <span>✅</span>
                <span style={{ marginLeft: 6 }}>API 연결됨</span>
              </div>
            )}
            {students.length > 0 && (
              <div style={pill}>
                <span>👥</span>
                <span style={{ marginLeft: 6 }}>{students.length}명</span>
              </div>
            )}
            {Object.keys(finalSelections).length > 0 && (
              <div style={{ ...pill, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", border: "none" }}>
                <span>✨</span>
                <span style={{ marginLeft: 6 }}>선택 {Object.keys(finalSelections).length}개</span>
              </div>
            )}
            <button
              style={{
                ...btn,
                padding: "10px 20px",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={() => setIsSettingsOpen(true)}
            >
              <span>⚙️</span>
              <span>설정</span>
            </button>
          </div>
        </div>

        <div style={card}>
          {/* Step 1: 스타일 샘플 입력 */}
          {step === 1 && (
            <div>
              <h2 style={h2}>📚 Step 1. 교사 종합의견 예시 입력</h2>
              <p style={desc}>
                과거에 작성했던 종합의견 샘플을 입력하세요. AI가 선생님의 <strong>문체와 어조</strong>를 학습하여 일관된 스타일로 의견을 생성합니다.
                <br />
                <span style={{ color: "#ef4444", fontWeight: 600 }}>※ 샘플의 내용은 참고하지 않고, 오직 문체와 표현 방식만 학습합니다.</span>
              </p>

              {styleSamples.map((sample, idx) => (
                <div key={sample.id} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontWeight: 700, fontSize: 14, color: "#4b5563" }}>
                      예시 {idx + 1} {sample.required && <span style={{ color: "#ef4444" }}>*</span>}
                    </label>
                    {!sample.required && styleSamples.length > 1 && (
                      <button
                        onClick={() => removeStyleSample(sample.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 20,
                          padding: 4,
                        }}
                        title="삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <textarea
                    style={ta}
                    rows={6}
                    placeholder={`과거에 작성한 종합의견을 입력하세요...\n\n※ AI는 이 샘플에서 문체, 어조, 표현 방식만 학습하고 내용은 참고하지 않습니다.`}
                    value={sample.text}
                    onChange={(e) => updateStyleSample(sample.id, e.target.value)}
                  />
                </div>
              ))}

              <button
                onClick={addStyleSample}
                style={{
                  ...btnOutline,
                  marginBottom: 24,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>+</span>
                <span>예시 추가</span>
              </button>

              <button
                style={{
                  ...btn,
                  width: "100%",
                  opacity: styleSamples.some(s => s.required && !s.text.trim()) ? 0.5 : 1,
                }}
                disabled={styleSamples.some(s => s.required && !s.text.trim())}
                onClick={() => setStep(2)}
              >
                다음 단계 →
              </button>
            </div>
          )}

          {/* Step 2: CSV 업로드 */}
          {step === 2 && (
            <div>
              <h2 style={h2}>📊 Step 2. 학생 명단 업로드</h2>
              <p style={desc}>
                학생 정보가 담긴 CSV 또는 엑셀 파일을 업로드하세요. 학번, 이름, 성별, 기타 특이사항 등이 포함되어야 합니다.
              </p>

              <label
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  padding: "14px 28px",
                  borderRadius: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 15,
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                  marginBottom: 16,
                }}
              >
                📁 파일 선택
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
              </label>

              {uploadedFileName && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 12, fontSize: 14, color: "#166534", fontWeight: 600 }}>
                  ✅ 업로드됨: {uploadedFileName}
                </div>
              )}

              {csvError && <div style={err}><span>⚠️</span><span>{csvError}</span></div>}

              {students.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "#1a202c" }}>
                    업로드된 학생 ({students.length}명)
                  </h3>
                  <div style={listBox}>
                    {students.map((s, i) => (
                      <div
                        key={s._id}
                        style={{
                          padding: "16px 20px",
                          borderBottom: i < students.length - 1 ? "1px solid #e5e7ef" : "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: selectedStudent?._id === s._id ? "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedStudent?._id !== s._id) {
                            e.currentTarget.style.background = "#f3f4f6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedStudent?._id !== s._id) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                        onClick={() => selectStudent(s)}
                      >
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a202c" }}>
                          {s.학번} - {s.이름} ({s.성별})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button style={btnOutline} onClick={() => setStep(1)}>
                  ← 이전
                </button>
                <button
                  style={{ ...btn, flex: 1, opacity: students.length === 0 ? 0.5 : 1 }}
                  disabled={students.length === 0}
                  onClick={() => {
                    if (students.length > 0) {
                      selectStudent(students[0]);
                    }
                  }}
                >
                  학생 선택하고 다음 →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 학생 선택 및 생성 */}
          {step === 3 && selectedStudent && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ ...h2, marginBottom: 4 }}>
                    ✏️ {selectedStudent.이름} 학생의 종합의견 작성
                  </h2>
                  <p style={{ ...desc, marginBottom: 0 }}>
                    {selectedStudent.학번} | {selectedStudent.성별}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={btnOutline} onClick={() => setStep(2)}>
                    ← 학생 목록
                  </button>
                  {Object.keys(finalSelections).length > 0 && (
                    <>
                      <button
                        style={{
                          ...btn,
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                        }}
                        onClick={exportToCSV}
                      >
                        📥 CSV 다운로드
                      </button>
                      <button
                        style={{
                          ...btn,
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
                        }}
                        onClick={exportToExcel}
                      >
                        📊 Excel 다운로드
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 학생 특성 선택 */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: "#1a202c" }}>
                  🎯 강조할 학생 특성 (선택사항)
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {studentTraits.map(trait => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: "2px solid",
                        borderColor: selectedTraits.includes(trait) ? "#667eea" : "#e5e7ef",
                        background: selectedTraits.includes(trait) ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#fff",
                        color: selectedTraits.includes(trait) ? "#fff" : "#4b5563",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {selectedTraits.includes(trait) ? "✓ " : ""}{trait}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q항목 표시 및 선택 */}
              {qEntries.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: "#1a202c" }}>
                    📋 학생 특이사항 (포함할 항목 선택)
                  </h3>
                  {qEntries.map(([k, v]) => {
                    const isSelected = selectedQItems[selectedStudent._id]?.[k];
                    return (
                      <div
                        key={k}
                        style={{
                          ...qaBox,
                          marginBottom: 12,
                          borderColor: isSelected ? "#667eea" : "#e6e9f2",
                          background: isSelected ? "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)" : "#fafbfc",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleQItem(k)}
                      >
                        <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ marginTop: 2, cursor: "pointer", width: 18, height: 18 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#667eea", marginBottom: 4 }}>{k}</div>
                            <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6 }}>{v}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                style={{ ...btn, width: "100%", marginBottom: 24, opacity: isGenerating ? 0.7 : 1 }}
                onClick={generateComment}
                disabled={isGenerating || !hasKey}
              >
                {isGenerating ? "⏳ 생성 중..." : "✨ 종합의견 생성하기"}
              </button>

              {apiError && <div style={err}><span>⚠️</span><span>{apiError}</span></div>}

              {generatedText && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "#1a202c", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>📄</span>
                    <span>최종 생성 의견</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                      ({generatedText.length}자)
                    </span>
                  </h3>
                  <textarea
                    style={{ ...ta, minHeight: 200, fontWeight: 500, lineHeight: 1.8 }}
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <button
                      style={btn}
                      onClick={() => copyToClipboard(generatedText)}
                    >
                      📋 복사
                    </button>
                    <button
                      style={btnOutline}
                      onClick={() => downloadAsText(generatedText, `${selectedStudent.이름}_종합의견.txt`)}
                    >
                      💾 저장
                    </button>
                    <button
                      style={{
                        ...btn,
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
                      }}
                      onClick={() => selectFinalOpinion(selectedStudent._id, generatedText)}
                    >
                      ⭐ 최종 선택
                    </button>
                  </div>

                  {finalSelections[selectedStudent._id] && (
                    <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef3c7", border: "2px solid #fbbf24", borderRadius: 12, fontSize: 14, color: "#92400e", fontWeight: 600 }}>
                      ⭐ 이 의견이 최종 선택되었습니다!
                    </div>
                  )}
                </div>
              )}

              {/* 생성 이력 표시 */}
              {generationHistory[selectedStudent._id] && generationHistory[selectedStudent._id].length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "#1a202c" }}>
                    📚 이전 생성 이력
                  </h3>
                  <div style={listBox}>
                    {generationHistory[selectedStudent._id].map((item, idx) => {
                      const historyLength = generationHistory[selectedStudent._id].length;
                      const displayNumber = historyLength - idx;
                      
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "20px",
                            borderBottom: idx < historyLength - 1 ? "1px solid #e5e7ef" : "none",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#667eea" }}>
                                #{displayNumber}
                              </span>
                              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                {new Date(item.timestamp).toLocaleString('ko-KR')}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                                ({item.text.length}자)
                              </span>
                            </div>
                          </div>
                          <textarea
                            style={{
                              ...ta,
                              minHeight: 120,
                              fontWeight: 500,
                              lineHeight: 1.8,
                              fontSize: 14,
                            }}
                            value={item.text}
                            onChange={(e) => updateHistoryItem(selectedStudent._id, idx, e.target.value)}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button
                              style={{
                                ...btnOutline,
                                padding: "8px 16px",
                                fontSize: 13,
                              }}
                              onClick={() => copyToClipboard(item.text)}
                            >
                              📋 복사
                            </button>
                            <button
                              style={{
                                ...btnOutline,
                                padding: "8px 16px",
                                fontSize: 13,
                              }}
                              onClick={() => {
                                setGeneratedText(item.text);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              ↑ 최종 의견으로
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 설정 모달 */}
        {isSettingsOpen && (
          <div style={modalBackdrop} onClick={() => setIsSettingsOpen(false)}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#1a202c" }}>⚙️ API 설정</h2>
                <button style={xBtn} onClick={() => setIsSettingsOpen(false)}>
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
                  LLM 제공자 선택
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  {Object.keys(providerConfigs).map(provider => (
                    <button
                      key={provider}
                      onClick={() => changeProvider(provider)}
                      style={{
                        ...providerBtn,
                        borderColor: apiProvider === provider ? "#667eea" : "#e5e7ef",
                        background: apiProvider === provider ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#fff",
                        color: apiProvider === provider ? "#fff" : "#4b5563",
                      }}
                    >
                      {provider === "openai" ? "OpenAI" :
                       provider === "claude" ? "Claude" :
                       provider === "gemini" ? "Gemini" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
                  API 키 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showKey ? "text" : "password"}
                    style={input}
                    placeholder="API 키를 입력하세요..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                  >
                    {showKey ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
                  API 엔드포인트 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  style={input}
                  placeholder="https://api.example.com/v1/chat/completions"
                  value={apiEndpointInput}
                  onChange={(e) => setApiEndpointInput(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
                  모델명 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  style={input}
                  placeholder="gpt-4o-mini"
                  value={apiModelInput}
                  onChange={(e) => setApiModelInput(e.target.value)}
                />
              </div>

              <div style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", padding: 20, borderRadius: 16, marginTop: 24 }}>
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
