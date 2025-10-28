"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Check, X, Clock, Eye } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000/api";

interface SellerRequest {
  id: number;
  user_id: number;
  shop_name: string;
  shop_description?: string;
  request_status: "pending" | "approved" | "rejected";
  created_at: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

const SellerRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Check admin auth
  useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        navigate("/login");
        return;
      }

      try {
        const user = JSON.parse(userStr);

        const hasAdminRole =
          user.roles &&
          Array.isArray(user.roles) &&
          user.roles.some((role: any) => role.id === 3);

        const isAdmin =
          hasAdminRole ||
          user.role === "admin" ||
          user.is_admin === true ||
          user.is_admin === 1 ||
          user.email === "admin@gmail.com" ||
          user.email === "admin@kas.com";

        if (!isAdmin) {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking admin:", error);
        navigate("/login");
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/seller_requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      console.log("Fetched seller requests:", data);

      const requestsData = (data?.data?.data || []).map((item: any) => ({
        id: item.id,
        user_id: item.id, // or replace with correct user_id if available
        shop_name: item.shop_name,
        shop_description: item.description,
        request_status: item.request_status,
        created_at: item.submitted_at,
        user: {
          name:
            item.name ||
            `${item.first_name || ""} ${item.last_name || ""}`.trim(),
          email: item.email,
          phone: item.phone,
        },
      }));

      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: number,
    status: "approved" | "rejected"
  ) => {
    const token = localStorage.getItem("token");
    try {
      // 👇 choose correct endpoint based on status
      const endpoint =
        status === "approved"
          ? `${API_BASE_URL}/seller_requests_approve/${id}`
          : `${API_BASE_URL}/seller_requests_reject/${id}`;

      console.log("Calling:", endpoint); // Debug log

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ request_status: status }),
      });

      if (response.ok) {
        fetchRequests();
      } else {
        const err = await response.text();
        console.error("Failed to update:", err);
      }
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || req.request_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "approved":
        return <Check size={16} />;
      case "rejected":
        return <X size={16} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading seller requests...</div>;
  }

  const pendingCount = requests.filter(
    (r) => r.request_status === "pending"
  ).length;
  const approvedCount = requests.filter(
    (r) => r.request_status === "approved"
  ).length;
  const rejectedCount = requests.filter(
    (r) => r.request_status === "rejected"
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Seller Requests
        </h1>
        <div className="flex gap-4 text-sm">
          <span className="text-yellow-600 font-medium">
            Pending: {pendingCount}
          </span>
          <span className="text-green-600 font-medium">
            Approved: {approvedCount}
          </span>
          <span className="text-red-600 font-medium">
            Rejected: {rejectedCount}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by shop name, user name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{request.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {request.shop_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div>{request.user?.name || `User #${request.user_id}`}</div>
                  <div className="text-xs text-gray-500">
                    {request.user?.email}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {request.shop_description || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusBadge(
                      request.request_status
                    )}`}
                  >
                    {getStatusIcon(request.request_status)}
                    {request.request_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {request.request_status === "pending" && (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() =>
                          handleStatusUpdate(request.id, "approved")
                        }
                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(request.id, "rejected")
                        }
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  {request.request_status !== "pending" && (
                    <span className="text-gray-400 text-xs">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No seller requests found
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRequests;
