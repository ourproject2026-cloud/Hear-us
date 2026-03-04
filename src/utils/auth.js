export const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};