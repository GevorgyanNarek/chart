exports.formatDate = (dateString) => {
  const [day, month, year] = dateString.split("/"); // Split the input date string by "/"
  const d = new Date(`${year}-${month}-${day}`); // Create a new Date object using the correct format

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};
