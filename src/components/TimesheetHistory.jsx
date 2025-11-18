import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Filter, X, Search, ChevronDown } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";
import { backendUrl } from "./config";
import { showToast } from "./Toast";

const getUserIPAddress = async () => {
  try {
    const endpoints = [
      "https://api.ipify.org?format=json",
      "https://ipapi.co/json/",
      "https://httpbin.org/ip",
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return data.ip || data.origin || "";
        }
      } catch {}
    }
    return "";
  } catch {
    return "";
  }
};

const columnsAdmin = [
  //   "Notify",
  "Status",
  "Exported",
  "Date",
  "Employee ID",
  "Name",
  "Timesheet Type Code",

  "Fiscal Year",
  "Period",
  "Project ID",
  "PLC",
  "Pay Type",
  // "RLSE Number",
  // "PO Number",
  // "PO Line Number",
  "Hours",
  "Seq No",
  "Approver Name",
  "Approve Timestamp",
  "Imported By",
  "Imported Timestamp",
];

const columnsViewer = [
  //   "Select",
  "Status",
  "Date",
  "Employee ID",
  "Timesheet Type Code",
  "Name",
  "Fiscal Year",
  "Period",
  "Project ID",
  "PLC",
  "Pay Type",
  "RLSE Number",
  "PO Number",
  "PO Line Number",
  "Hours",
  "Seq No",
  "Comment",
  // "Approver Name",
  "Approve Timestamp",
  "Imported By",
  "Imported Timestamp",
];

const ReasonModal = ({
  isOpen,
  action,
  selectedCount,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);
  if (!isOpen) return null;
  const handleConfirm = () =>
    reason.trim()
      ? onConfirm(reason.trim())
      : showToast("Please provide a reason.", "warning");
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) handleConfirm();
    else if (e.key === "Escape") onCancel();
  };
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg p-6 w-96 max-w-90vw shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {action === "approve" ? "Approve" : "Reject"} Timesheets
          </h3>
          <p className="text-sm text-gray-600">
            You are about to {action} {selectedCount} timesheet
            {selectedCount > 1 ? "s" : ""}. Please provide a reason:
          </p>
        </div>
        <div className="mb-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Enter reason for ${
              action === "approve" ? "approving" : "rejecting"
            } these timesheets...`}
            className="w-full h-24 p-3 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
            autoFocus
          />
          <div className="text-xs text-gray-500 mt-1">
            {reason.length}/500 characters • Press Ctrl+Enter to confirm • Esc
            to cancel
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {action === "approve" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TimesheetHistory() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedNotifyRows, setSelectedNotifyRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [notifySelectAll, setNotifySelectAll] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // State for filters
  const [searchDate, setSearchDate] = useState("");
  const [searchEmployeeId, setSearchEmployeeId] = useState("");
  const [searchEmployeeName, setSearchEmployeeName] = useState("");
  const [statusFilters, setStatusFilters] = useState({});
  const [importLoading, setImportLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const fileInputRef = useRef(null);

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [userIpAddress, setUserIpAddress] = useState("");

  // New state for global search
  const [globalSearch, setGlobalSearch] = useState("");
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());
  const startYear = 2022;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);

  const isAdmin = currentUser?.role === "Admin";
  const isUser =
    currentUser?.role === "User" || currentUser?.role === "BackupUser";
  const columns = isAdmin ? columnsAdmin : columnsViewer;
  const colWidth = 120;
  const minTableWidth = columns.length * colWidth;

  // Initialize status filters based on user role
  useEffect(() => {
    if (isAdmin) {
      setStatusFilters({
        OPEN: false,
        PENDING: false,
        REJECTED: false,
        APPROVED: false,
      });
    } else if (isUser) {
      setStatusFilters({
        APPROVED: false,
        PENDING: false,
        REJECTED: false,
      });
    }
  }, [isAdmin, isUser, currentUser]); // Re-run when user role changes

  // Format date to MM/DD/YYYY with leading zeros
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      // Expecting dateString in "YYYY-MM-DD"
      const parts = dateString.split("-");
      if (parts.length !== 3) return dateString;

      const [year, month, day] = parts;
      // Return MM/DD/YYYY without using Date() to avoid timezone shifts
      return `${month}/${day}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return "";
    const numHours = parseFloat(hours);
    if (isNaN(numHours)) return hours;
    return numHours.toFixed(2);
  };
  // Convert YYYY-MM-DD from date input to MM/DD/YYYY for display and comparison
  const formatDateFromInput = (inputDate) => {
    if (!inputDate) return "";
    try {
      const date = new Date(inputDate + "T00:00:00");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return "";
    }
  };

  const getSortedRows = (rowsToSort) => {
    let sorted = [...rowsToSort];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal, bVal;

        // Handle different column types
        if (sortConfig.key === "Date") {
          aVal = new Date(a.originalDate || a["Date"]);
          bVal = new Date(b.originalDate || b["Date"]);
          if (isNaN(aVal.getTime())) aVal = new Date(0);
          if (isNaN(bVal.getTime())) bVal = new Date(0);
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        } else if (sortConfig.key === "Hours") {
          aVal = parseFloat(a[sortConfig.key]) || 0;
          bVal = parseFloat(b[sortConfig.key]) || 0;
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        } else if (sortConfig.key === "Status") {
          const getStatusPriority = (status) => {
            const statusUpper = String(status || "PENDING").toUpperCase();
            switch (statusUpper) {
              case "OPEN":
                return 1;
              case "PENDING":
                return 2;
              case "APPROVED":
                return 3;
              case "REJECTED":
                return 4;
              case "NOTIFIED":
                return 5;
              default:
                return 6;
            }
          };

          aVal = getStatusPriority(a["Status"]);
          bVal = getStatusPriority(b["Status"]);
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        } else {
          aVal = String(a[sortConfig.key] || "").toLowerCase();
          bVal = String(b[sortConfig.key] || "").toLowerCase();

          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        }
      });
    } else {
      // Default sorting
      sorted.sort((a, b) => {
        let aDate = new Date(a.originalDate || a["Date"]);
        let bDate = new Date(b.originalDate || b["Date"]);
        if (isNaN(aDate.getTime())) aDate = new Date(0);
        if (isNaN(bDate.getTime())) bDate = new Date(0);
        if (aDate.getTime() !== bDate.getTime())
          return aDate.getTime() - bDate.getTime();
        const aEmpId = String(a["Employee ID"] || "").toLowerCase();
        const bEmpId = String(b["Employee ID"] || "").toLowerCase();
        return aEmpId.localeCompare(bEmpId);
      });
    }

    return sorted;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (["Select", "Notify"].includes(columnKey)) return null;

    if (sortConfig.key === columnKey) {
      return sortConfig.direction === "asc" ? "↑" : "↓";
    }
    return "⇅";
  };

  const getStatusStyle = (status) => {
    const statusUpper = status?.toUpperCase() || "PENDING";

    switch (statusUpper) {
      case "OPEN":
        return {
          backgroundColor: "#dbeafe",
          color: "#2563eb",
          fontWeight: "600",
          padding: "4px 8px",
          fontSize: "11px",
          display: "inline-block",
        };
      case "APPROVED":
        return {
          backgroundColor: "#dcfce7",
          color: "#16a34a",
          fontWeight: "600",
          padding: "4px 8px",
          fontSize: "11px",
          display: "inline-block",
        };
      case "REJECTED":
        return {
          backgroundColor: "#fce7f3",
          color: "#ec4899",
          fontWeight: "600",
          padding: "4px 8px",
          fontSize: "11px",
          display: "inline-block",
        };
      case "PENDING":
        return {
          backgroundColor: "#fef9c3",
          color: "#ca8a04",
          fontWeight: "600",
          padding: "4px 8px",
          fontSize: "11px",
          display: "inline-block",
        };
      case "NOTIFIED":
        return {
          backgroundColor: "#dbeafe",
          color: "#2563eb",
          fontWeight: "600",
          padding: "4px 8px",
          fontSize: "11px",
          display: "inline-block",
        };
      case "UN-NOTIFIED":
      case "UNNOTIFIED":
        return {
          backgroundColor: "#dcfce7",
          color: "#16a34a",
          fontWeight: "600",
          padding: "4px 8px",
          fontSize: "11px",
          display: "inline-block",
        };
      default:
        return {
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
          fontWeight: "500",
          padding: "4px 8px",
          fontSize: "11px",
          display: "inline-block",
        };
    }
  };

  useEffect(() => {
    getUserIPAddress().then((ip) => setUserIpAddress(ip || ""));
  }, []);

  useEffect(() => {
    const userInfo = localStorage.getItem("currentUser");
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        if (!parsedUser.username) {
          parsedUser.username =
            parsedUser.id === "john"
              ? "john.doe"
              : parsedUser.id === "jane"
              ? "jane.smith"
              : parsedUser.id;
        }
        setCurrentUser(parsedUser);
        setUserLoaded(true);
      } catch (error) {
        showToast("Session expired. Please login again.", "error");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    setSelectedRows([]);
    setSelectedNotifyRows([]);
    setSelectAll(false);
    setNotifySelectAll(false);
  }, []);

  useEffect(() => {
    if (userLoaded && currentUser && currentUser.username) fetchData();
  }, [userLoaded, currentUser, isAdmin]);

  // const fetchData = async () => {
  //   if (!userLoaded || !currentUser || !currentUser.username) return;
  //   try {
  //     setLoading(true);
  //     let apiUrl = "";
  //     if (isAdmin) {
  //       apiUrl = `${backendUrl}/api/Timesheet/GetExportedTimesheets`;
  //     } else if (isUser) {
  //       apiUrl = `${backendUrl}/api/Timesheet/GetExportedTimesheets`;
  //     } else {
  //       setRows([]);
  //       setLoading(false);
  //       return;
  //     }
  //     const response = await fetch(apiUrl, {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //     });
  //     if (!response.ok)
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     const apiData = await response.json();

  //     const mappedData = Array.isArray(apiData)
  //       ? apiData.map((item, index) => ({
  //           id: item.timesheetId || item.id || `fallback-${index}`,
  //           Exported: item.isExported ? "Y" : "N",
  //           requestId: item.requestId || item.id,
  //           levelNo: item.levelNo || 1,
  //           selected: false,
  //           notifySelected: false,
  //           isApproved: item.approvalStatus === "APPROVED" || false,
  //           isRejected: item.approvalStatus === "REJECTED" || false,
  //           isNotified: item.approvalStatus === "NOTIFIED" || false,
  //           status: isAdmin
  //             ? item.status?.toLowerCase() || "open" // Default to 'open' for admin if null/undefined
  //             : item.approvalStatus?.toLowerCase() || "pending", // Default to 'pending' for user if null/undefined
  //           originalDate: item.timesheetDate,
  //           Date: formatDate(item.timesheetDate),
  //           "Employee ID": item.employee?.employeeId || item.employeeId || "",
  //           "Timesheet Type Code": item.timesheetTypeCode || "",
  //           Name:
  //             item.displayedName ||
  //             item.employeeName ||
  //             `Employee ${item.employee?.employeeId || item.employeeId}` ||
  //             "",
  //           "Approver Name": item.approvedBy || "",
  //           "Approve Timestamp": item.approvedDate ? item.approvedDate : " ",
  //           "Imported By": item.createdBy || "",
  //           "Imported Timestamp": item.importedTimestamp,
  //           "Fiscal Year": item.fiscalYear || "",
  //           Period: item.period || "",
  //           "Project ID": item.projectId || "",
  //           Account: item.accountId || "",
  //           Org: item.organizationId || "",
  //           PLC: item.projectLaborCategory || "",
  //           "Pay Type": item.payType || "",
  //           "RLSE Number": item.rlseNumber || "",
  //           "PO Number": item.poNumber || "",
  //           "PO Line Number": item.poLineNumber || "",
  //           Hours: formatHours(item.hours),
  //           "Seq No": item.sequenceNumber || "",
  //           Status: isAdmin
  //             ? item.approvalStatus || "OPEN" // Default to 'OPEN' for admin
  //             : item.approvalStatus || "PENDING", // Default to 'PENDING' for user
  //           Comment: item.comment || "",
  //           isNotified: isAdmin
  //             ? (item.status || "").toLowerCase() === "notified"
  //             : (item.approvalStatus || "").toLowerCase() === "notified",
  //         }))
  //       : [];

  //     setRows(mappedData);
  //   } catch (error) {
  //     setRows([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchData = async () => {
    if (!userLoaded || !currentUser || !currentUser.username) return;

    try {
      setLoading(true);

      // Get current month and year
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString(); // getMonth() is zero-based
      const currentYear = now.getFullYear().toString();

      // Construct API URL, always pass current month and year by default
      const apiUrl = `${backendUrl}/api/Timesheet/GetExportedTimesheets?month=${currentMonth}&year=${currentYear}`;

      // Fetch data from the API
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch timesheet data");
      }

      const data = await res.json();

      const mappedData = Array.isArray(data)
        ? data.map((item) => ({
            Status: item.approvalStatus,
            Date: formatDate(item.timesheetDate),
            Exported: item.isExported ? "Y" : "N",
            "Employee ID": item.employeeId,
            Name: item.displayedName,
            "Timesheet Type Code": item.timesheetTypeCode,
            "Fiscal Year": item.fiscalYear,
            Period: item.period,
            "Project ID": item.projectId,
            PLC: item.projectLaborCategory,
            "Pay Type": item.payType,
            "RLSE Number": item.rlseNumber,
            "PO Number": item.poNumber,
            "PO Line Number": item.poLineNumber,
            Hours: item.hours,
            "Seq No": item.sequenceNumber,
            "Approver Name": item.approvedBy,
            "Approve Timestamp": item.approvedDate ? item.approvedDate : " ",
            "Imported By": item.createdBy || "",
            "Imported Timestamp": item.importedTimestamp,
            "Approved Date": item.approvedDate
              ? formatDate(item.approvedDate)
              : "NA",
          }))
        : [];

      setRows(mappedData); // upd
    } catch (error) {
      showToast("Error loading exported timesheets.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRows = () => {
    let filtered = rows;
    if (!Array.isArray(filtered)) return [];

    // --- 1. Global Search (New) ---
    if (globalSearch.trim()) {
      const searchTerm = globalSearch.trim().toLowerCase();
      filtered = filtered.filter((row) => {
        // Check against multiple fields
        return (
          (row["Employee ID"] || "").toLowerCase().includes(searchTerm) ||
          (row["Name"] || "").toLowerCase().includes(searchTerm) ||
          (row["Approver Name"] || "").toLowerCase().includes(searchTerm) ||
          (row["Project ID"] || "").toLowerCase().includes(searchTerm) ||
          (row["PO Number"] || "").toLowerCase().includes(searchTerm) ||
          (row["RLSE Number"] || "").toLowerCase().includes(searchTerm) ||
          (row["Timesheet Type Code"] || "").toLowerCase().includes(searchTerm)
        );
      });
    }

    // --- 2. Advanced Filters (Existing) ---
    if (searchDate) {
      const searchDateFormatted = formatDateFromInput(searchDate);
      filtered = filtered.filter((row) => {
        const rowDate = row["Date"];
        return rowDate === searchDateFormatted;
      });
    }
    if (searchEmployeeId.trim()) {
      filtered = filtered.filter((row) =>
        (row["Employee ID"] || "")
          .toLowerCase()
          .includes(searchEmployeeId.trim().toLowerCase())
      );
    }
    if (searchEmployeeName.trim()) {
      filtered = filtered.filter((row) =>
        (row["Name"] || "")
          .toLowerCase()
          .includes(searchEmployeeName.trim().toLowerCase())
      );
    }

    // --- 3. Status Filter (Existing) ---
    const selectedStatuses = Object.entries(statusFilters)
      .filter(([status, checked]) => checked)
      .map(([status]) => status);

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((row) =>
        selectedStatuses.some((status) =>
          row["Status"].toUpperCase().includes(status.toUpperCase())
        )
      );
    }

    return getSortedRows(filtered);
  };

  const filteredRows = getFilteredRows();

  const handleRowSelect = (rowIndex, isSelected) => {
    if (!isUser) return;
    const updatedRows = [...rows];
    const actualRowIndex = rows.findIndex(
      (row) => row.id === filteredRows[rowIndex].id
    );
    updatedRows[actualRowIndex].selected = isSelected;
    setRows(updatedRows);
    const rowData = filteredRows[rowIndex];
    if (isSelected) {
      setSelectedRows((prev) => [...prev, rowData]);
    } else {
      setSelectedRows((prev) => prev.filter((item) => item.id !== rowData.id));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (isSelected) => {
    if (!isUser) return;
    setSelectAll(isSelected);

    // Create a Set of IDs for the currently filtered rows for quick lookup
    const filteredRowIds = new Set(filteredRows.map((row) => row.id));

    // Iterate through *all* rows in the main state
    const updatedRows = rows.map((row) => {
      // Only consider changing selection if the row is currently visible in the filtered list
      if (filteredRowIds.has(row.id)) {
        // Check if the row's status is PENDING (this is the only actionable status for select all)
        const isPending = (row["Status"] || "").toUpperCase() === "PENDING";
        return {
          ...row,
          // Set selected to true ONLY if isSelected is true AND the status is PENDING
          // Otherwise, set it to false (this handles unchecking too)
          selected: isSelected && isPending,
        };
      }
      // If the row isn't in the current filter, keep its selected state unchanged
      return row;
    });

    setRows(updatedRows);

    // Update the selectedRows state based on the rows that ended up being selected
    setSelectedRows(updatedRows.filter((row) => row.selected));
  };

  const isRowActionable = (row) =>
    row.Status === "PENDING" && !row.isApproved && !row.isRejected;
  const hasPendingRows = Array.isArray(filteredRows)
    ? filteredRows.some((row) => isRowActionable(row))
    : false;

  const handleClearAllFilters = () => {
    setGlobalSearch(""); // Clear global search
    setSearchDate("");
    setSearchEmployeeId("");
    setSearchEmployeeName("");

    // Reset all statusFilters values to false
    setStatusFilters((prev) =>
      Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {})
    );
  };

  const fetchFilteredData = async () => {
    if (!filterMonth || !filterYear) {
      showToast("Please select both month and year.", "warning");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = `${backendUrl}/api/Timesheet/GetExportedTimesheets?month=${filterMonth}&year=${filterYear}`;
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to fetch data.");

      const data = await res.json();

      const mappedData = Array.isArray(data)
        ? data.map((item) => ({
            Status: item.approvalStatus,
            Date: formatDate(item.timesheetDate),
            Exported: item.isExported ? "Y" : "N",
            "Employee ID": item.employeeId,
            Name: item.displayedName,
            "Timesheet Type Code": item.timesheetTypeCode,
            "Fiscal Year": item.fiscalYear,
            Period: item.period,
            "Project ID": item.projectId,
            PLC: item.projectLaborCategory,
            "Pay Type": item.payType,
            "RLSE Number": item.rlseNumber,
            "PO Number": item.poNumber,
            "PO Line Number": item.poLineNumber,
            Hours: item.hours,
            "Seq No": item.sequenceNumber,
            "Approver Name": item.approvedBy,
            "Approve Timestamp": item.approvedDate ? item.approvedDate : " ",
            "Imported By": item.createdBy || "",
            "Imported Timestamp": item.importedTimestamp,
            "Approved Date": item.approvedDate
              ? formatDate(item.approvedDate)
              : "NA",
          }))
        : [];

      setRows(mappedData); // upd
    } catch (error) {
      showToast("Error fetching filtered data.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!userLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f9fafd] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading user session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafd] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading timesheet data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Removed outer padding
    <div className="min-h-screen bg-[#f9fafd] flex flex-col overflow-auto">
      {/* Changed inner padding */}
      <div className="flex-1 flex flex-col items-center justify-start p-2">
        <div className="w-full flex flex-col items-center">
          {/* --- Improved Header Section with Logo --- */}
          {/* --- End of Improved Header Section --- */}
          {/* --- Improved Filters Section (Single Line) --- */}
          <div className="w-full bg-gray-800 p-4 rounded-lg shadow border border-gray-200 mb-4 flex flex-wrap items-center gap-3">
            {/* --- Global Search --- */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search ID, Name, Project..."
                className="border border-gray-300 rounded-md px-3 py-1.5 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm w-full"
              />
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* --- Advanced Filter Toggle --- */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 bg-white text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors shadow-sm border border-gray-300"
            >
              Advanced
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* --- Advanced Filter Inputs (Conditional) --- */}
            {showAdvanced && (
              <>
                {" "}
                {/* Use Fragment to keep items in the same flex row */}
                <DatePicker
                  selected={
                    searchDate ? new Date(searchDate + "T00:00:00") : null
                  }
                  onChange={(date) => {
                    if (date) {
                      const localDate = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000
                      );
                      const isoString = localDate.toISOString().split("T")[0];
                      setSearchDate(isoString);
                    } else {
                      setSearchDate("");
                    }
                  }}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Filter by Date"
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm w-32"
                  showPopperArrow={false}
                  autoComplete="off"
                />
                <input
                  type="text"
                  value={searchEmployeeId}
                  onChange={(e) => setSearchEmployeeId(e.target.value)}
                  placeholder="Filter by Employee ID"
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm w-36"
                />
                <input
                  type="text"
                  value={searchEmployeeName}
                  onChange={(e) => setSearchEmployeeName(e.target.value)}
                  placeholder="Filter by Name"
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm w-36"
                />
              </>
            )}

            {/* Spacer to push remaining items to the right */}
            <div className="flex-grow"></div>
            <div className="flex items-center gap-2">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="border rounded px-2 py-1 text-xs"
              >
                <option value="">Month</option>
                <option value="01">Jan</option>
                <option value="02">Feb</option>
                <option value="03">Mar</option>
                <option value="04">Apr</option>
                <option value="05">May</option>
                <option value="06">Jun</option>
                <option value="07">Jul</option>
                <option value="08">Aug</option>
                <option value="09">Sep</option>
                <option value="10">Oct</option>
                <option value="11">Nov</option>
                <option value="12">Dec</option>
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="border rounded px-2 py-1 text-xs"
              >
                <option value="">Year</option>
                {[...Array(currentYear - startYear + 1)].map((_, i) => {
                  const year = startYear + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                onClick={fetchFilteredData}
                // disabled={!filterMonth || !filterYear}
              >
                Filter
              </button>
            </div>
          </div>
          {/* --- End of Improved Filters Section --- */}

          {/* --- Table Container Card --- */}
          <div
            className="border border-gray-300 rounded bg-gray-800 shadow w-full" // Added w-full
            style={{
              maxWidth: "none",
              minWidth: 300,
              padding: "0.5rem",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              flex: "1 1 auto", // Make card grow
            }}
          >
            {/* --- Table Scrolling Container --- */}
            <div
              style={{
                overflowX: "auto", // Allow horizontal scroll
                overflowY: "auto", // Allow vertical scroll
                width: "100%", // Take full width of parent
                flex: "1 1 auto", // Grow and shrink appropriately
                border: "1px solid #e5e7eb",
                borderRadius: "4px",

                maxHeight: "calc(100vh - 200px)", // Maximum height relative to viewport, adjust the 200px offset as needed for your header/footers
                height: "auto",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  fontSize: "11px",
                  minWidth: `${minTableWidth}px`, // Ensure it expands if needed
                  width: "100%", // Make table try to fit container
                  tableLayout: "auto", // Allow browser to determine column widths initially
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#f8fafc",
                    zIndex: 10,
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        style={{
                          border: "1px solid #d1d5db",
                          padding: "8px",
                          fontSize: "12px",
                          minWidth:
                            col === "Select" || col === "Notify"
                              ? "80px"
                              : `${colWidth}px`,
                          fontWeight: "bold",
                          color: "#1e40af",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          backgroundColor: "#f1f5f9",
                          cursor: ["Select", "Notify"].includes(col)
                            ? "default"
                            : "pointer",
                          userSelect: "none",
                        }}
                        onClick={() =>
                          !["Select", "Notify"].includes(col) && handleSort(col)
                        }
                      >
                        {col === "Select" && isUser ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              justifyContent: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={(e) =>
                                handleSelectAll(e.target.checked)
                              }
                              className="cursor-pointer"
                              disabled={!hasPendingRows}
                            />
                            <span
                              style={{ fontSize: "11px", fontWeight: "normal" }}
                            >
                              All
                            </span>
                          </div>
                        ) : col === "Notify" && isAdmin ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              justifyContent: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={notifySelectAll}
                              onChange={(e) =>
                                handleNotifySelectAll(e.target.checked)
                              }
                              className="cursor-pointer"
                            />
                            <span
                              style={{ fontSize: "11px", fontWeight: "normal" }}
                            >
                              All
                            </span>
                          </div>
                        ) : (
                          <span>
                            {col}
                            {getSortIcon(col)}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row, rdx) => (
                      <tr
                        key={`${row.requestId || row.id || rdx}-${
                          row["Employee ID"] || ""
                        }-${rdx}`}
                        style={{
                          backgroundColor:
                            (row.selected && isUser) ||
                            (row.notifySelected && isAdmin)
                              ? "#dbeafe"
                              : rdx % 2 === 0
                              ? "#f9fafb"
                              : "white",
                        }}
                        onMouseEnter={(e) =>
                          !row.selected &&
                          !row.notifySelected &&
                          (e.target.closest("tr").style.backgroundColor =
                            "#f3f4f6")
                        }
                        onMouseLeave={(e) =>
                          !row.selected &&
                          !row.notifySelected &&
                          (e.target.closest("tr").style.backgroundColor =
                            rdx % 2 === 0 ? "#f9fafb" : "white")
                        }
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            style={{
                              border: "1px solid #e5e7eb",
                              padding: "8px",
                              fontSize: "11px",
                              minWidth:
                                col === "Select" || col === "Notify"
                                  ? "80px"
                                  : `${colWidth}px`,
                              whiteSpace: "nowrap",
                              textAlign: "center",
                              ...(col === "Status"
                                ? getStatusStyle(row[col])
                                : {}),
                            }}
                          >
                            {col === "Status" ? (
                              <span
                                style={getStatusStyle(row[col] || "PENDING")}
                              >
                                {row[col] || "PENDING"}
                              </span>
                            ) : col === "Select" && isUser ? (
                              <input
                                type="checkbox"
                                checked={row.selected || false}
                                onChange={(e) =>
                                  handleRowSelect(rdx, e.target.checked)
                                }
                                className="cursor-pointer"
                                // disabled={!isRowActionable(row)}
                                disabled={
                                  !isRowActionable(row) ||
                                  (row["Status"] || "").toLowerCase() ===
                                    "approved"
                                }
                              />
                            ) : col === "Notify" && isAdmin ? (
                              <input
                                type="checkbox"
                                checked={row.notifySelected || false}
                                onChange={(e) =>
                                  handleNotifyRowSelect(rdx, e.target.checked)
                                }
                                className="cursor-pointer"
                                // disabled={row.isNotified || (row["Status"] || "").toLowerCase() === "notified" || (row["Status"] || "").toLowerCase() === "pending"}
                                disabled={
                                  row.isNotified ||
                                  (row["Status"] || "").toUpperCase() ===
                                    "NOTIFIED" ||
                                  (row["Status"] || "").toUpperCase() ===
                                    "PENDING" ||
                                  (row["Status"] || "").toUpperCase() ===
                                    "APPROVED" ||
                                  (row["Status"] || "").toUpperCase() ===
                                    "REJECTED"
                                }
                              />
                            ) : (
                              row[col] || ""
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          fontStyle: "italic",
                          color: "#FFF",
                        }}
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* --- End of Table Scrolling Container --- */}
          </div>
          {/* --- End of Table Container Card --- */}
        </div>
      </div>
    </div>
  );
}
