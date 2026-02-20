/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  useGetAllTimeSlotsQuery,
  useCreateTimeSlotMutation,
  useUpdateTimeSlotMutation,
  useDeleteTimeSlotMutation,
} from "@/store/moviesApi";
import { TimeSlot, CreateTimeSlotRequest } from "@/lib/database/schema";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
  Calendar,
  Users,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimeSlotsManagement() {
  const [tmdbFilter, setTmdbFilter] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState<CreateTimeSlotRequest>({
    tmdb_movie_id: 0,
    show_date: "",
    show_time: "",
    total_seats: 100,
    price: 12.99,
    screen_type: "2D",
  });

  const {
    data: timeSlots = [],
    isLoading,
    refetch,
  } = useGetAllTimeSlotsQuery(
    tmdbFilter.trim()
      ? { tmdb_movie_id: parseInt(tmdbFilter, 10) || undefined }
      : undefined,
  );
  const [createTimeSlot] = useCreateTimeSlotMutation();
  const [updateTimeSlot] = useUpdateTimeSlotMutation();
  const [deleteTimeSlot] = useDeleteTimeSlotMutation();

  const handleCreate = async () => {
    try {
      await createTimeSlot(formData).unwrap();
      setIsCreateModalOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error("Failed to create time slot:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingSlot) return;

    try {
      await updateTimeSlot({
        id: editingSlot.id,
        updates: {
          total_seats: formData.total_seats,
          price: formData.price,
          screen_type: formData.screen_type,
        },
      }).unwrap();
      setEditingSlot(null);
      resetForm();
      refetch();
    } catch (error) {
      console.error("Failed to update time slot:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this time slot?")) {
      try {
        await deleteTimeSlot(id).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete time slot:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tmdb_movie_id: 0,
      show_date: "",
      show_time: "",
      total_seats: 100,
      price: 12.99,
      screen_type: "2D",
    });
  };

  const startEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      tmdb_movie_id: slot.tmdb_movie_id,
      show_date: slot.show_date,
      show_time: slot.show_time,
      total_seats: slot.total_seats,
      price: slot.price,
      screen_type: slot.screen_type,
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return "text-red-500";
    if (percentage <= 25) return "text-orange-500";
    return "text-green-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-64"></div>
            <div className="h-4 bg-zinc-800 rounded w-96"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Time Slots Management</h1>
            <p className="text-zinc-400">
              Manage movie show times and availability
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Time Slot
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <input
            type="number"
            value={tmdbFilter}
            onChange={(e) => setTmdbFilter(e.target.value)}
            className="w-72 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-primary"
            placeholder="Filter by TMDB Movie ID"
          />
          {tmdbFilter && (
            <button
              onClick={() => setTmdbFilter("")}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
            >
              Clear
            </button>
          )}
          <span className="text-sm text-zinc-400">
            Rows: {timeSlots.length}
          </span>
        </div>

        {/* Time Slots Table */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Movie ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Screen
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Booked
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Available
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {timeSlots.map((slot) => (
                  <tr
                    key={slot.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {slot.tmdb_movie_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <span>
                          {new Date(slot.show_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span>{formatTime(slot.show_time)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-zinc-800 rounded text-sm font-medium">
                        {slot.screen_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span>{slot.total_seats}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span>
                        {slot.booked_seats ??
                          slot.total_seats - slot.available_seats}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span>{slot.available_seats}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        ${slot.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          getAvailabilityColor(
                            slot.available_seats,
                            slot.total_seats,
                          ),
                        )}
                      >
                        {slot.available_seats === 0
                          ? "Sold Out"
                          : slot.available_seats <= 10
                            ? "Few Left"
                            : "Available"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(slot)}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(isCreateModalOpen || editingSlot) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingSlot ? "Edit Time Slot" : "Create Time Slot"}
                </h2>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingSlot(null);
                    resetForm();
                  }}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    TMDB Movie ID
                  </label>
                  <input
                    type="number"
                    value={formData.tmdb_movie_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tmdb_movie_id: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter TMDB movie ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Show Date
                  </label>
                  <input
                    type="date"
                    value={formData.show_date}
                    onChange={(e) =>
                      setFormData({ ...formData, show_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Show Time
                  </label>
                  <select
                    value={formData.show_time}
                    onChange={(e) =>
                      setFormData({ ...formData, show_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="09:00">09:00</option>
                    <option value="12:00">12:00</option>
                    <option value="15:00">15:00</option>
                    <option value="18:00">18:00</option>
                    <option value="21:00">21:00</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Screen Type
                  </label>
                  <select
                    value={formData.screen_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        screen_type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total Seats
                  </label>
                  <input
                    type="number"
                    value={formData.total_seats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_seats: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter total seats"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter ticket price"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingSlot(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSlot ? handleUpdate : handleCreate}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingSlot ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
