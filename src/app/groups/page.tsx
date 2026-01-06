"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";

interface GroupMember {
  id: string;
  group_id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Group {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  members: GroupMember[];
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [newMember, setNewMember] = useState<{ groupId: string; name: string; email: string } | null>(null);
  const [editingMember, setEditingMember] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const res = await fetch("/api/groups");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setGroups(data.groups || []);

      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setUserEmail(sessionData.user?.email || "");
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createGroup() {
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });

      if (res.ok) {
        setNewGroupName("");
        setShowNewGroup(false);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  }

  async function updateGroup(id: string) {
    if (!editGroupName.trim()) return;

    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editGroupName }),
      });

      if (res.ok) {
        setEditingGroup(null);
        setEditGroupName("");
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to update group:", error);
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm("Delete this group and all its members?")) return;

    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (res.ok) fetchGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  }

  async function addMember() {
    if (!newMember || !newMember.name.trim() || !newMember.email.trim()) return;

    try {
      const res = await fetch(`/api/groups/${newMember.groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMember.name, email: newMember.email }),
      });

      if (res.ok) {
        setNewMember(null);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  }

  async function updateMember(groupId: string) {
    if (!editingMember || !editingMember.name.trim() || !editingMember.email.trim()) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: editingMember.id,
          name: editingMember.name,
          email: editingMember.email,
        }),
      });

      if (res.ok) {
        setEditingMember(null);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to update member:", error);
    }
  }

  async function deleteMember(groupId: string, memberId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (res.ok) fetchGroups();
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        <Header email={userEmail || "Loading..."} title="Groups" />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header
        email={userEmail}
        title="Groups"
        rightAction={
          <button
            onClick={() => setShowNewGroup(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        }
      />

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* New Group Form */}
        {showNewGroup && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm">
            <h2 className="font-semibold mb-3">New Group</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800"
                autoFocus
              />
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewGroup(false);
                  setNewGroupName("");
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No groups yet
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              Create groups to quickly send dumps to multiple people
            </p>
            <button
              onClick={() => setShowNewGroup(true)}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Group Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  {editingGroup === group.id ? (
                    <div className="flex gap-2 flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800"
                        autoFocus
                      />
                      <button
                        onClick={() => updateGroup(group.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-xl text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingGroup(null);
                          setEditGroupName("");
                        }}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-xl text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {group.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {editingGroup !== group.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(group.id);
                            setEditGroupName(group.name);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGroup(group.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedGroup === group.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Members */}
                {expandedGroup === group.id && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                    {group.members.length === 0 ? (
                      <p className="text-gray-500 text-sm mb-4">No members yet</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                          >
                            {editingMember?.id === member.id ? (
                              <div className="flex gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingMember.name}
                                  onChange={(e) =>
                                    setEditingMember({ ...editingMember, name: e.target.value })
                                  }
                                  placeholder="Name"
                                  className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                />
                                <input
                                  type="email"
                                  value={editingMember.email}
                                  onChange={(e) =>
                                    setEditingMember({ ...editingMember, email: e.target.value })
                                  }
                                  placeholder="Email"
                                  className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                />
                                <button
                                  onClick={() => updateMember(group.id)}
                                  className="px-2 py-1 bg-blue-500 text-white rounded-lg text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingMember(null)}
                                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      setEditingMember({
                                        id: member.id,
                                        name: member.name,
                                        email: member.email,
                                      })
                                    }
                                    className="p-1.5 text-gray-400 hover:text-blue-500"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => deleteMember(group.id, member.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Member */}
                    {newMember?.groupId === group.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          placeholder="Name"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm"
                          autoFocus
                        />
                        <input
                          type="email"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          placeholder="Email"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm"
                        />
                        <button
                          onClick={addMember}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setNewMember(null)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewMember({ groupId: group.id, name: "", email: "" })}
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add member
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <TabBar />
    </div>
  );
}
