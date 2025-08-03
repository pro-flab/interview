import { useState } from "react";
import "./App.css";

interface VerificationResponse {
  success: boolean;
  message: string;
  data?: {
    phoneNumber?: string;
    expiresAt?: number;
    verified?: boolean;
  };
}

function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      setMessage("휴대폰 번호를 입력해주세요.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data: VerificationResponse = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType("success");
      } else {
        setMessage(data.message);
        setMessageType("error");
      }
    } catch {
      setMessage("서버 오류가 발생했습니다.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!phoneNumber || !verificationCode) {
      setMessage("휴대폰 번호와 인증번호를 입력해주세요.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, code: verificationCode }),
      });

      const data: VerificationResponse = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType("success");
        setVerificationCode("");
      } else {
        setMessage(data.message);
        setMessageType("error");
      }
    } catch {
      setMessage("서버 오류가 발생했습니다.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>휴대폰 인증번호 테스트</h1>
      <p>MSW를 활용한 휴대폰 인증번호 API 테스트</p>

      <div className="form-container">
        <div className="form-group">
          <label htmlFor="phoneNumber">휴대폰 번호:</label>
          <input
            id="phoneNumber"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="010-1234-5678"
            disabled={isLoading}
          />
        </div>

        <div className="button-group">
          <button
            onClick={sendVerificationCode}
            disabled={isLoading || !phoneNumber}
            className="send-button"
          >
            {isLoading ? "발송 중..." : "인증번호 발송"}
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="verificationCode">인증번호:</label>
          <input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="6자리 인증번호"
            disabled={isLoading}
            maxLength={6}
          />
        </div>

        <div className="button-group">
          <button
            onClick={verifyCode}
            disabled={isLoading || !phoneNumber || !verificationCode}
            className="verify-button"
          >
            {isLoading ? "확인 중..." : "인증번호 확인"}
          </button>
        </div>

        {message && <div className={`message ${messageType}`}>{message}</div>}
      </div>

      <div className="info">
        <h3>사용 방법:</h3>
        <ul>
          <li>휴대폰 번호를 입력하고 "인증번호 발송" 버튼을 클릭하세요</li>
          <li>콘솔에서 발송된 인증번호를 확인할 수 있습니다</li>
          <li>인증번호를 입력하고 "인증번호 확인" 버튼을 클릭하세요</li>
          <li>인증번호는 5분 후 만료됩니다</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
