# 생활기록부 종합의견 생성기

> AI를 활용한 중학교 생활기록부 종합의견 자동 생성 시스템

---

## 📌 개요

이 도구는 **Google Forms 설문 응답 데이터를 바탕으로 AI가 종합의견을 자동 생성**해주는 웹 애플리케이션입니다.

- ✨ **AI 기반 생성**: OpenAI/Claude API를 활용한 고품질 종합의견 작성
- 📊 **다양한 파일 지원**: CSV, Excel(XLSX) 파일 모두 지원
- 🔒 **완벽한 보안**: 모든 데이터는 로컬에서만 처리 (외부 서버 전송 안 함)
- 🚀 **빠른 배포**: 설치 없이 웹에서 즉시 사용 가능
- 💬 **선생님 의도 반영**: 교사 예시를 통해 원하는 스타일의 종합의견 생성

---

## 🎯 주요 기능

### 1️⃣ **API 키 설정**
- OpenAI 또는 Claude API 키 입력
- API 키는 브라우저 로컬 저장소에만 저장 (안전함)
- 언제든 변경 가능

### 2️⃣ **데이터 불러오기**
- **CSV 또는 Excel(XLSX) 파일 지원**
- Google Forms 응답 다운로드 파일 업로드
- 📥 **테스트용 샘플 파일 제공** - 바로 다운로드해서 기능 확인 가능

### 3️⃣ **학생 선택 및 종합의견 생성**
- 📋 학생별 설문 응답 검토
- ✅ Q1~Q10 중 **반영할 항목만 체크** (자동 개수 카운트)
- ✨ 학생의 특성 선택 (중복 선택 가능)
- 🎨 종합의견 생성 스타일 선택

### 4️⃣ **결과 확인 및 내보내기**
- 생성된 종합의견 확인
- ✏️ 필요시 직접 수정 가능
- 📥 CSV 파일로 내보내기 (여러 명 한 번에 처리 가능)

---

## 🚀 시작하기

### 온라인 접속
```
https://comment-generator-q7nd.vercel.app
```

### 📝 기본 사용 흐름

#### Step 1: API 키 설정
```
1. 앱 접속 후 "API 키 설정" 버튼 클릭
2. OpenAI 또는 Claude API 키 입력
3. 저장
```

#### Step 2: 데이터 파일 불러오기
```
✅ 옵션 A: 실제 데이터 파일 업로드
   - Google Forms 응답을 CSV/Excel로 다운로드
   - 앱의 2단계에서 업로드

✅ 옵션 B: 샘플 파일로 테스트 (권장)
   - "📊 샘플 파일 다운로드" 버튼 클릭
   - 다운로드한 파일을 바로 업로드
   - 기능 미리 확인 가능!
```

#### Step 3: 학생 선택 및 항목 검토
```
1. 학생 목록에서 이름 클릭
2. 📋 설문 응답 검토
3. Q1~Q10 중 반영할 항목 체크 (반영 항목 개수 자동 표시)
4. ✨ 학생의 특성 선택
5. 🎨 종합의견 생성 스타일 선택 (선택사항)
```

#### Step 4: 종합의견 생성 및 저장
```
1. "종합의견 생성" 버튼 클릭
2. AI가 생성한 종합의견 확인 (400-500자)
3. 필요시 직접 수정
4. "✅ 저장" 클릭
5. 다음 학생 진행
```

#### Step 5: 최종 내보내기
```
모든 학생 처리 완료
  ↓
"📥 CSV 내보내기" 버튼 클릭
  ↓
Excel에서 열어서 최종 확인 및 활용
```

---

## 📥 샘플 데이터

### 📊 테스트용 파일
```
1학년 생활기록부 기초자료 조사(응답샘플).xlsx
```

**용도:**
- 앱의 기능을 미리 테스트
- 학생 데이터 포맷 확인
- 종합의견 생성 결과 확인

**다운로드 방법:**
1. 앱의 Step 2 화면으로 이동
2. "📊 샘플 파일 다운로드" 버튼 클릭
3. 파일 받기
4. 바로 업로드해서 테스트!

---

## 📊 데이터 형식

### 필수 컬럼

| 컬럼명 | 설명 | 예시 |
|--------|------|------|
| 이름 | 학생 이름 | 김민준 |
| 학번 네자리 | 학번 뒤 4자리 | 0215 |
| Q1~Q10 | 설문 응답 내용 | (자유로운 응답 텍스트) |

### 선택사항
- ✅ Q11 이상 추가 질문 가능 (자동으로 반영됨)
- ✅ 다른 부가 정보 열도 포함 가능

### ⚠️ 한글 인코딩 주의
- Google Sheets에서 "Microsoft Excel(.xlsx)" 형식으로 다운로드
- 또는 Excel에서 "CSV UTF-8" 형식으로 저장
- 샘플 파일 형식 참고

---

## 🔒 보안 및 개인정보 보호

### 🟢 로컬 처리 (완벽 안전)
```
✅ CSV/Excel 파싱: 브라우저에서만 처리
✅ 파일 저장: 개인 컴퓨터 저장소 사용
✅ 데이터 다운로드: 브라우저에서만 진행
```

### 🟡 외부 API 전송 (필요한 것만)
```
⚠️ OpenAI/Claude API: 종합의견 생성용으로만 전송
   ├─ 학생 이름, 학번: 포함 안 함
   ├─ Q 항목 텍스트: 필요시 포함 (의견 생성용)
   └─ 학생의 특성: 포함
```

### 개인정보 보호 원칙
- ✅ CSV 파일 전체는 외부 서버로 전송되지 않음
- ✅ 모든 데이터 처리는 로컬에서만 진행
- ✅ 다운로드 파일도 브라우저에서만 저장
- ✅ API 키는 로컬 저장소에만 저장됨

---

## 🛠 기술 스택

### Frontend
- **React 18**: 사용자 인터페이스
- **Vite**: 번들러 및 개발 서버

### Libraries
- **Papaparse**: CSV 파일 파싱
- **XLSX**: Excel 파일 지원
- **Fetch API**: OpenAI/Claude API 연동

### 배포
- **Vercel**: 클라우드 배포 플랫폼
- **GitHub**: 소스 코드 관리

---

## 📋 주요 특징 상세

### ✨ Q 항목 선택 기능
- Q1~Q10 중 실질적인 내용만 선택
- 선택한 항목 개수 **자동 표시**
- 일반적이거나 추상적인 표현은 제외 권장

### 🎨 종합의견 생성 옵션
- 교사 예시를 통한 **스타일 커스터마이징**
- **400-500자** 범위의 적절한 길이 자동 조정
- 학업, 인성, 사회성 등 **균형있는 구성**

### 📊 데이터 관리
- 한 명씩 검토 및 수정 가능
- 여러 명 일괄 내보내기
- Excel에서 재사용 가능한 CSV 형식

---

## 🔧 설치 및 로컬 개발

### 요구사항
- Node.js 16 이상
- npm 또는 yarn

### 설치 방법

```bash
# 저장소 복제
git clone https://github.com/getbetterwithme/comment-generator.git
cd comment-generator

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
# http://localhost:5173 에서 접속

# 프로덕션 빌드
npm run build
```

---

## 📁 파일 구조

```
comment-generator/
├── src/
│   ├── App.jsx              # 메인 애플리케이션
│   ├── App.css              # 스타일시트
│   ├── main.jsx             # React 진입점
│   └── assets/              # 이미지 및 자산
├── public/                  # 공개 파일
├── index.html               # HTML 진입점
├── package.json             # 의존성 정의
├── package-lock.json        # 의존성 잠금
├── vite.config.js           # Vite 설정
├── eslint.config.js         # ESLint 설정
├── README.md                # 이 파일
└── 1학년 생활기록부 기초자료 조사(응답샘플).xlsx  # 샘플 데이터
```

---

## 🐛 트러블슈팅

### Q: 파일 업로드가 안 돼요
**A:** 
- ✓ CSV 또는 Excel(XLSX) 파일인지 확인
- ✓ 필수 컬럼(이름, 학번 네자리, Q1~Q10)이 있는지 확인
- ✓ 샘플 파일 형식 참고

### Q: 종합의견이 너무 짧아요/길어요
**A:**
- ✓ 프롬프트에서 400-500자 범위 지정됨
- ✓ Q 항목을 충분히 선택했는지 확인
- ✓ 교사 예시에 구체적인 사례 포함하기

### Q: API 키가 안 저장돼요
**A:**
- ✓ 브라우저 개인정보보호 모드 확인
- ✓ 캐시 삭제 후 다시 시도
- ✓ 다른 브라우저로 테스트

### Q: Excel 파일이 한글이 깨져요
**A:**
- ✓ Google Sheets에서 "Microsoft Excel(.xlsx)" 형식으로 다운로드
- ✓ 또는 Excel에서 "CSV UTF-8" 형식으로 저장
- ✓ 샘플 파일 형식 참고

### Q: Vercel 배포가 느려요
**A:**
- ✓ 배포는 보통 1-2분 소요
- ✓ Vercel 대시보드에서 상태 확인 가능
- ✓ 앱을 새로고침 후 확인 (Ctrl+Shift+R)

---

## 👥 제작자 및 문의

### 제작자
**서울사대부중 1학년부**

교육 현장의 업무 부담을 줄이고, 더 의미있는 교육에 집중할 수 있도록 개발했습니다.

### 📞 문의 및 건의
- **이메일**: june_wook@snu.ms.kr
- **GitHub Issues**: [이슈 등록하기](https://github.com/getbetterwithme/comment-generator/issues)

---

## 📄 라이선스

**MIT License** - 자유롭게 사용, 수정, 배포 가능

```
Copyright (c) 2025 서울사대부중 1학년부

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 감사의 말씀

- **Anthropic** - Claude AI 제공
- **OpenAI** - GPT API 제공
- **Vercel** - 무료 배포 플랫폼
- **React & Vite 커뮤니티** - 훌륭한 개발 도구
- **Papaparse & XLSX 개발자들** - 훌륭한 라이브러리

---

## 📚 참고 자료

### 샘플 파일
- [1학년 생활기록부 기초자료 조사(응답샘플).xlsx](./1학년%20생활기록부%20기초자료%20조사(응답샘플).xlsx)

### 관련 문서
- [빠른 시작 가이드](./DEPLOYMENT_QUICK_START.md)
- [배포 가이드](./deployment_guide.md)

### 유용한 링크
- [React 공식 문서](https://react.dev)
- [Vite 공식 문서](https://vitejs.dev)
- [Vercel 문서](https://vercel.com/docs)

---

## 🚀 로드맵

### 🟢 현재 기능
- ✅ CSV/Excel 파일 지원
- ✅ Q 항목 선택 기능
- ✅ AI 기반 종합의견 생성
- ✅ 직접 편집 기능
- ✅ CSV 내보내기

### 🟡 향후 계획
- 🔄 다중 LLM 지원 (Google Gemini 등)
- 🔄 번역 기능
- 🔄 템플릿 시스템
- 🔄 일괄 처리 개선
- 🔄 모바일 최적화

---

**마지막 업데이트**: 2025년 12월 17일  
**현재 버전**: 1.0.0  
**상태**: ✅ 정상 운영 중
