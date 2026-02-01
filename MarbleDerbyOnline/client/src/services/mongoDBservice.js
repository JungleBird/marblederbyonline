const API_URL = "http://localhost:5000/api/v1";

export const pingMongoDB = async () => {
  try {
    const response = await fetch(`${API_URL}/ping`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data.message);
    return data;
  } catch (error) {
    console.error("Error connecting to MongoDB via server:", error);
    throw error;
  }
};

// Add a new user to the 'marbleDB' database's 'users' collection
export const addUser = async ({ username, email }) => {
  try {
    const lastLogin = new Date().toISOString();
    const response = await fetch(`${API_URL}/users/createUser`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, lastlogin: lastLogin }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding user to MongoDB via server:", error);
    throw error;
  }
};
