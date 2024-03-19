import React, { useState } from "react";
import {
  Button,
  Container,
  Input,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import './EventMailer.css';

const sampleData = [
  {
    "S.No": 1,
    "Event Name": "Meeting",
    Date: 45366.4166666667,
    "Email Addresses": [
      "techvisers24@gmail.com",
      "saicharannayanagari@gmail.com",
    ],
    "Phone Numbers": 9010877381,
    Message: "Upcoming Meeting",
  },
  {
    "S.No": 2,
    "Event Name": "Training",
    Date: 45366.4166666667,
    "Email Addresses": ["saicharannayanagari@gmail.com"],
    "Phone Numbers": 9985253736,
    Message: "Upcoming Meeting",
  },
  // Add more rows as needed
];
const downloadSampleTemplate = () => {
  // Convert sample data to a worksheet
  const worksheet = XLSX.utils.json_to_sheet(
    sampleData.map((row) => ({
      ...row,
      "Email Addresses": row["Email Addresses"].join(", "), // Join email addresses with comma
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Events");

  // Create a temporary anchor element and trigger the download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "sample_template.xlsx");
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
};

const EventMailer = () => {
  const [fileData, setFileData] = useState(null);
  const [success, setsuccess] = useState(false);
  const [disabled,setDisabled] = useState(false);
  const sendPostRequest = async () => {
    setDisabled(true);

    if (!fileData) {
      alert("No data to send");
      return;
    }

    // Filter out rows where the message is empty
    const dataToSend = fileData
      .filter((row) => row.message.trim() !== "")
      .map(({ "S.No": _, ...rest }) => rest);

    if (dataToSend.length === 0) {
      alert("No valid data to send");
      return;
    }

    const url = "http://localhost:8080/store-events"; // Replace with your actual endpoint URL
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    };

    try {
      const response = await fetch(url, requestOptions);
      if (response.status!=200) {
        // Handle response errors
        const errorMessage = `An error occurred: ${response.statusText}`;
        console.error(errorMessage);
        alert(errorMessage);
        setDisabled(true);
        return;
      }
      setsuccess(!success);
      setDisabled(false);
    //   alert("Data sent successfully");
      
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send data");
      setDisabled(true);
    }
  };
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error(
        "No file selected or the file input is in an unexpected state."
      );
      return;
    }
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const excelSerialToDate = (serial) => {
        const excelStartDate = new Date(Date.UTC(1899, 11, 30)); // Excel base date is December 30, 1899
        const days = Math.floor(serial);
        const fractionalDay = serial - days;
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const fractionalDayMilliseconds = fractionalDay * millisecondsPerDay;

        // Calculate the exact date and time
        const exactDate = new Date(
          excelStartDate.getTime() +
            days * millisecondsPerDay +
            fractionalDayMilliseconds
        );

        // Format the date and time in "dd/mm/yyyy hh:mm" format
        const formattedDate =
          exactDate.getUTCDate().toString().padStart(2, "0") +
          "/" +
          (exactDate.getUTCMonth() + 1).toString().padStart(2, "0") +
          "/" +
          exactDate.getUTCFullYear();

        return formattedDate;
      };
      // Convert and clean up the data

      const nonEmptyRows = jsonData.filter((row) =>
        Object.values(row).some((cell) => cell !== "")
      );

      // Convert and clean up the data
      const modifiedData = nonEmptyRows.map(
        ({
          "S.No": _,
          "Event Name": eventName,
          Date: DateTime,
          "Email Addresses": emailAddresses,
          Message: message,
          "Phone Numbers": b,
          ...rest
        }) => ({
          eventName,
          DateTime: excelSerialToDate(DateTime), // Assuming excelSerialToDate function converts the date format
          emailAddresses: emailAddresses
            ? emailAddresses.split(",").map((email) => email.trim())
            : [],
          message: message ? message.replace(/\n/g, " ").trim() : "", // Replace newlines and trim
          ...rest,
        })
      );

      setFileData(modifiedData);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <style>
        {`
          .download-btn-container {
            text-align: right;
            padding: 10px 0;
          }
          .custom-download-btn {
            background-color: #f8f9fa; /* A light gray color */
            color: #212529; /* Bootstrap's default dark color */
            padding: 10px 20px;
            border: 1px solid #dee2e6; /* Light border color */
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.15s ease-in-out;
          }
          .custom-download-btn:hover {
            background-color: #e2e6ea; /* A slightly darker gray on hover */
          }
        `}
      </style>

      <Container className="mt-5">
        <div className="download-btn-container">
          <button
            className="custom-download-btn"
            onClick={downloadSampleTemplate}
          >
            Download Sample Template
          </button>
        </div>
        <h2 className="mb-4">Anniversary Mail Sender</h2>
        <InputGroup className="mb-3">
          <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
          <InputGroupText>
            <Button color="primary" onClick={sendPostRequest} disabled={disabled}>
              Schedule
            </Button>
          </InputGroupText>
        </InputGroup>
        {success && (
          <div>
            {/* <h3>Uploaded Data (JSON with Emails as List)</h3>
            <pre>{JSON.stringify(fileData, null, 2)}</pre> */}
            <h2>Scheduled Mails successfully</h2>
          </div>
        )}
      </Container>
    </>
  );
};

export default EventMailer;