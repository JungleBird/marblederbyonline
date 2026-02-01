import { useReducer, useEffect, useRef } from "react";

// Initial state
const initialState = {
  step: 0,
  email: "",
  code: "",
  error: null,
  shouldShake: false,
  isVerified: false,
  userType: null,
};

// Reducer to handle all state updates
const loginReducer = (state, action) => {
  switch (action.type) {
    case "MOVE_TO_STEP":
      return { ...state, step: action.payload };
    case "SET_EMAIL":
      return { ...state, email: action.payload, error: null };
    case "SET_CODE":
      return { ...state, code: action.payload, error: null };
    case "VALIDATION_ERROR":
      return {
        ...state,
        error: action.payload,
        shouldShake: true,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "RESET_SHAKE":
      return { ...state, shouldShake: false };
    case "SELECT_USER_TYPE":
      return { ...state, userType: action.payload };
    case "START_VERIFICATION":
      return { ...state, isVerified: false };
    case "VERIFICATION_SUCCESS":
      return { ...state, isVerified: true };
    default:
      return state;
  }
};

export default function useLoginFlow(navigate) {
  const [state, dispatch] = useReducer(loginReducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const flowResolver = useRef(null);

  // Helpers to control the flow
  const waitForInteraction = () => {
    return new Promise((resolve, reject) => {
      flowResolver.current = { resolve, reject };
    });
  };

  const handleNext = (data) => {
    if (flowResolver.current) {
      flowResolver.current.resolve(data);
    }
  };

  const handleBack = () => {
    if (flowResolver.current) {
      flowResolver.current.reject("BACK");
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleKeyDown = (e, callback, value) => {
    if (e.key === "Enter") callback(value);
  };

  // Request verification code for the provided email
  const handleRequestCode = async (email) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/login/request-code",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        dispatch({ type: "VALIDATION_ERROR", payload: data.error });
        return false;
      }

      console.log("Request Code API Response:", data);
      return true;
    } catch (err) {
      console.error("Request Code API Error:", err);
      dispatch({
        type: "VALIDATION_ERROR",
        payload: "Network error. Please try again.",
      });
      return false;
    }
  };

  // Verify the code and login/signup; cookie will store JWT automatically
  const handleVerifyCode = async (email, code) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/login/verify-code",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        dispatch({ type: "VALIDATION_ERROR", payload: data.error });
        return false;
      }

      console.log("Verify Code API Response:", data);
      return true;
    } catch (err) {
      console.error("Verify Code API Error:", err);
      dispatch({
        type: "VALIDATION_ERROR",
        payload: "Network error. Please try again.",
      });
      return false;
    }
  };

  // Main login flow orchestration
  useEffect(() => {
    let active = true;

    const runLoginFlow = async () => {
      let currentStep = 0;

      while (active) {
        dispatch({ type: "MOVE_TO_STEP", payload: currentStep });

        try {
          if (currentStep === 0) {
            // --- STEP 0: User Type ---
            console.log("Waiting for user type selection...");
            const userType = await waitForInteraction();
            console.log("Selected:", userType);
            dispatch({ type: "SELECT_USER_TYPE", payload: userType });
            currentStep = 1;
          } else if (currentStep === 1) {
            // --- STEP 1: Email ---
            const inputEmail = await waitForInteraction();

            if (!inputEmail || !inputEmail.includes("@")) {
              dispatch({
                type: "VALIDATION_ERROR",
                payload: "Invalid email address",
              });
              continue;
            }

            dispatch({ type: "SET_EMAIL", payload: inputEmail });
            // Request verification code from server
            const requested = await handleRequestCode(inputEmail);
            if (!requested) {
              continue;
            }
            currentStep = 2;
          } else if (currentStep === 2) {
            // --- STEP 2: Verification Code ---
            const inputCode = await waitForInteraction();

            if (!inputCode || inputCode.length !== 6) {
              dispatch({
                type: "VALIDATION_ERROR",
                payload: "Invalid code. Please try again.",
              });
              continue;
            }

            dispatch({ type: "SET_CODE", payload: inputCode });
            // Verify code (server will login or create user as needed)
            const verified = await handleVerifyCode(
              stateRef.current.email,
              inputCode
            );
            if (!verified) {
              continue;
            }
            currentStep = 3;
          } else if (currentStep === 3) {
            // --- STEP 3: Loading / Success ---
            dispatch({ type: "START_VERIFICATION" });
            await wait(1500);
            dispatch({ type: "VERIFICATION_SUCCESS" });
            await wait(1500);
            navigate("/test");
            break;
          }
        } catch (error) {
          if (error === "BACK") {
            dispatch({ type: "CLEAR_ERROR" });
            currentStep = Math.max(0, currentStep - 1);
          }
        }
      }
    };

    runLoginFlow();

    return () => {
      active = false;
      if (flowResolver.current) flowResolver.current.reject("UNMOUNT");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset shake animation
  useEffect(() => {
    if (state.shouldShake) {
      const timer = setTimeout(() => {
        dispatch({ type: "RESET_SHAKE" });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.shouldShake]);

  const rotation = state.step * -90;

  return {
    step: state.step,
    email: state.email,
    setEmail: (value) => dispatch({ type: "SET_EMAIL", payload: value }),
    code: state.code,
    setCode: (value) => dispatch({ type: "SET_CODE", payload: value }),
    error: state.error,
    shouldShake: state.shouldShake,
    isVerified: state.isVerified,
    userType: state.userType,
    handleNext,
    handleBack,
    handleKeyDown,
    rotation,
  };
}
