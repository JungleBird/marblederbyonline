import React from "react";
import colorfulLights from "../assets/colorful-lights.png";
import { useNavigate } from "react-router-dom";
import useLoginFlow from "../hooks/useLoginFlow";
import {
  PageContainer,
  Scene,
  Cube,
  FaceFront,
  FaceRight,
  FaceBack,
  FaceLeft,
  Input,
  Button,
  Title,
  ErrorText,
  FaceContent,
  ErrorBox,
  ShakeWrapper,
} from "../styles/LoginCube.styles";

const LoginCube = () => {
  const navigate = useNavigate();
  const {
    step,
    email,
    setEmail,
    code,
    setCode,
    error,
    shouldShake,
    isVerified,
    handleNext,
    handleBack,
    handleKeyDown,
    rotation,
  } = useLoginFlow(navigate);

  return (
    <Scene>
      <ShakeWrapper $shouldShake={shouldShake}>
        <Cube $rotation={rotation}>
          {/* FACE 0: Login As */}
          <FaceFront>
            <FaceContent>
              <Title>Login As</Title>
              <Button
                $extrude={40}
                onClick={() => handleNext("existingUser")}
                style={{ width: "100%", maxWidth: 240 }}
              >
                Log In
              </Button>
              <Button
                $extrude={40}
                onClick={() => handleNext("newUser")}
                style={{ width: "100%", maxWidth: 240 }}
              >
                Sign Up
              </Button>
              <Button
                $extrude={40}
                onClick={() => handleNext("temporaryUser")}
                style={{ width: "100%", maxWidth: 240 }}
              >
                Guest
              </Button>
              <ErrorBox />
            </FaceContent>
          </FaceFront>

          {/* FACE 1: Email */}
          <FaceRight>
            <FaceContent>
              <Title>Email</Title>
              <Input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleNext, email)}
                style={{ width: "100%", maxWidth: 240 }}
              />
              <ErrorBox>
                {step === 1 && error && <ErrorText>{error}</ErrorText>}
              </ErrorBox>
              <Button
                $extrude={40}
                onClick={() => handleNext(email)}
                style={{ width: "100%", maxWidth: 240 }}
              >
                Submit
              </Button>
              <Button
                $extrude={40}
                $variant="outline"
                onClick={handleBack}
                style={{ width: "100%", maxWidth: 240, marginTop: 4 }}
              >
                Back
              </Button>
            </FaceContent>
          </FaceRight>

          {/* FACE 2: Verification */}
          <FaceBack>
            <FaceContent>
              <Title>Verification</Title>
              <Input
                type="text"
                placeholder="6-Digit Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleNext, code)}
                maxLength={6}
                style={{
                  width: "100%",
                  maxWidth: 240,
                  letterSpacing: 4,
                  textAlign: "center",
                }}
              />
              <ErrorBox>
                {step === 2 && error && <ErrorText>{error}</ErrorText>}
              </ErrorBox>
              <Button
                $extrude={40}
                onClick={() => handleNext(code)}
                style={{ width: "100%", maxWidth: 240 }}
              >
                Verify
              </Button>
              <Button
                $extrude={40}
                $variant="outline"
                onClick={handleBack}
                style={{ width: "100%", maxWidth: 240, marginTop: 4 }}
              >
                Back
              </Button>
            </FaceContent>
          </FaceBack>

          {/* FACE 3: Loading / Success */}
          <FaceLeft>
            <FaceContent>
              {!isVerified ? (
                <>
                  <Title>Loading...</Title>
                  <div
                    style={{
                      fontSize: "40px",
                      animation: "spin 1s linear infinite",
                    }}
                  >
                    🔄
                  </div>
                </>
              ) : (
                <>
                  <Title>Success!</Title>
                  <p style={{ color: "#a5b4fc" }}>Welcome back to the game.</p>
                </>
              )}
            </FaceContent>
          </FaceLeft>
        </Cube>
      </ShakeWrapper>
    </Scene>
  );
};

export default function LoginPage() {
  return (
    <PageContainer
      style={{
        backgroundImage: `url(${colorfulLights})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      <LoginCube />
    </PageContainer>
  );
}
