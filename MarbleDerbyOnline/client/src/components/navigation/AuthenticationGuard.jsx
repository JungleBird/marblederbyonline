import React, { useMemo } from "react";

export const AuthenticationGuard = ({ component }) => {

  /* placeholder for authentication logic

  const Component = useMemo(
    () =>
      withAuthenticationRequired(component, {
        onRedirecting: () => (
          <div className="page-layout">
            <div>Loading...</div>
          </div>
        ),
      }),
    [component]

  );
  */
  const Component = component;
  return <Component />;
};