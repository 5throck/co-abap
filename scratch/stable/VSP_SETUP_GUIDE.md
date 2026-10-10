# VSP SAP 연결 설정 가이드
# VSP SAP Connection Setup Guide

## SAP 시스템 연결 정보 필요

VSP가 SAP 시스템에 연결하려면 다음 정보가 필요합니다:

### 필수 연결 정보 (Required Connection Info)

| 환경 변수 | 설명 | 예시 | 현재 값 |
|----------|------|------|---------|
| `SAP_URL` | SAP 시스템 URL | `http://vhcalnplci:50000` | ? |
| `SAP_CLIENT` | SAP Client 번호 | `001` | `001` |
| `SAP_USER` | SAP 사용자 이름 | `DEVELOPER` | ? |
| `SAP_PASSWORD` | SAP 비밀번호 | `***` | ? |

### 연결 방법 1: 환경 변수 사용 (Environment Variables)

```bash
export SAP_URL="http://vhcalnplci:50000"
export SAP_CLIENT="001"
export SAP_USER="DEVELOPER"
export SAP_PASSWORD="your_password"
export VSP_MODE="hyperfocused"
export VSP_ALLOWED_PACKAGES="Z*,\$TMP,\$ZADT_VSP,\$VSP_ADT"

# 연결 테스트
./vsp system info
```

### 연결 방법 2: 프로젝트 `.env` 파일 사용 (권장)

프로젝트 루트에 `.env` 파일을 만들고 권한을 `600`으로 설정합니다. `.env`는 `.gitignore`에 포함되어 있습니다.

```bash
chmod 600 .env
```

`.env` 내용 (`.env.sample`을 복사해 값만 채웁니다):
```bash
SAP_URL=http://vhcalnplci:50000
SAP_CLIENT=001
SAP_USER=DEVELOPER
SAP_PASSWORD=<YOUR_PASSWORD>
```

비밀번호를 `config.toml`이나 셸 프로필(`~/.bashrc`)에 평문으로 저장하지 마십시오. OS 키체인(macOS Keychain, Windows Credential Manager, Linux `secret-tool`)을 사용하는 것도 허용됩니다.

### 연결 방법 3: 명령행 플래그 사용 (Command Line Flags) — 비밀번호 제외

명령행에 비밀번호를 넣으면 셸 기록과 프로세스 목록에 남으므로 사용하지 마십시오. 연결 정보는 `.env`(방법 2)에 두고, 명령에는 URL과 클라이언트만 지정합니다.

```bash
./vsp system info \
  --url "http://vhcalnplci:50000" \
  --client "001" \
  --username "DEVELOPER"
```

---

## 연결 테스트 (Connection Test)

연결이 성공하면 다음과 같은 정보가 표시됩니다:

```
System Information
==================
System ID: NPL
Client: 001
Host: vhcalnplci
Instance: 00
Database: ...

ABAP Version: 7.52
Current User: DEVELOPER
```

---

## 연결 문제 해결 (Troubleshooting)

### 에러: "connection refused"
**원인**: SAP 시스템이 실행 중이 아님
**해결**:
```bash
# SAP 시스템 상태 확인
# Linux: /usr/sap/hostctrl/exe/sapcontrol -nr 00 -function GetProcessList

# 또는 포트 확인
netstat -an | grep 50000
```

### 에러: "authentication failed"
**원인**: 잘못된 사용자 이름 또는 비밀번호
**해결**:
- SAP GUI로 로그인 가능한지 확인
- 사용자가 잠기지 않았는지 확인 (SU01 T-Code)

### 에러: "CSRF token validation failed"
**원인**: CSRF 토큰 문제
**해결**: VSP가 자동으로 처리하므로 재시도

### 에러: "timeout"
**원인**: 네트워크 지연 또는 방화벽
**해결**:
```bash
# 연결 시간 증가
export VSP_TIMEOUT=60

# ping 테스트
ping vhcalnplci
```

---

## 다음 단계 (Next Steps)

연결 성공 후, ABAP 객체 자동 생성:

```bash
# 1. 테이블 생성
./vsp deploy zinv_stock.tabl '$TMP'

# 2. 클래스 생성
./vsp deploy zcl_inventory_manager.clas.abap '$TMP'

# 3. 프로그램 생성
./vsp deploy zprog_inventory_manager.prog.abap '$TMP'

# 4. 메시지 클래스 생성
./vsp deploy zinv_messages.tmsg.abap '$TMP'

# 5. 문법 체크
# 5. 문법 체크: MCP SAP(action="analyze", params={"type":"syntax_check", ...})

# 6. 단위 테스트
./vsp test zcl_inventory_manager

# 7. ATC 체크
./vsp atc zcl_inventory_manager
```

---

## 보안 참고사항 (Security Notes)

⚠️ **비밀번호 보안**:
- 절대로 비밀번호를 스크립트에 하드코딩하지 마세요
- 환경 변수 대신 keychain 사용을 권장합니다
- Config 파일은 `chmod 600`으로 권한을 제한하세요

**macOS Keychain 사용 예시**:
```bash
# 비밀번호 저장
security add-generic-password \
  -a "DEVELOPER" \
  -s "vsp-npl" \
  -w "your_password"

# 비밀번호 조회
SAP_PASSWORD=$(security find-generic-password \
  -s "vsp-npl" \
  -w)

export SAP_PASSWORD
```

---

## 현재 상태 (Current Status)

✅ VSP v2.38.1 설치 완료
⏳ SAP 연결 정보 입력 필요
⏳ ABAP 객체 생성 대기 중

---

**질문**: SAP 시스템 연결 정보를 입력하시겠습니까?
- 사용자 이름 (Username): ?
- 비밀번호 (Password): ?
- SAP URL (예: http://vhcalnplci:50000): ?
