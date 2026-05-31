
// utils/formatDate.js
const formatMonthYear = (isoString) => {
  if (!isoString) return "";

  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long", 
  });
};

export default formatMonthYear;
