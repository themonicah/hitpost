"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

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

      // Get user email from session
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
      const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchGroups();
      }
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

      if (res.ok) {
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Nav email={userEmail} />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-gray-500">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav email={userEmail} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Recipient Groups</h1>
          <button
            onClick={() => setShowNewGroup(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
          >
            + New Group
          </button>
        </div>

        <p className="text-gray-500 mb-6">
          Create groups to quickly send meme dumps to multiple people at once.
        </p>

        {/* New Group Form */}
        {showNewGroup && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 shadow-sm">
            <h2 className="font-semibold mb-3">Create New Group</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name (e.g., Family, Work Friends)"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                autoFocus
              />
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewGroup(false);
                  setNewGroupName("");
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
            <p className="text-gray-500 mb-4">No groups yet</p>
            <button
              onClick={() => setShowNewGroup(true)}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Group Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() =>
                    setExpandedGroup(expandedGroup === group.id ? null : group.id)
                  }
                >
                  {editingGroup === group.id ? (
                    <div className="flex gap-2 flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                        autoFocus
                      />
                      <button
                        onClick={() => updateGroup(group.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingGroup(null);
                          setEditGroupName("");
                        }}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                      </p>
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
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGroup(group.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <span
                      className={`transform transition-transform ${
                        expandedGroup === group.id ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded Members */}
                {expandedGroup === group.id && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                    {/* Members List */}
                    {group.members.length === 0 ? (
                      <p className="text-gray-500 text-sm mb-4">No members yet</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
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
                                  className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm"
                                />
                                <input
                                  type="email"
                                  value={editingMember.email}
                                  onChange={(e) =>
                                    setEditingMember({ ...editingMember, email: e.target.value })
                                  }
                                  placeholder="Email"
                                  className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm"
                                />
                                <button
                                  onClick={() => updateMember(group.id)}
                                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingMember(null)}
                                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
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
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      setEditingMember({
                                        id: member.id,
                                        name: member.name,
                                        email: member.email,
                                      })
                                    }
                                    className="text-xs text-gray-400 hover:text-blue-500"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteMember(group.id, member.id)}
                                    className="text-xs text-gray-400 hover:text-red-500"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Member Form */}
                    {newMember?.groupId === group.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMember.name}
                          onChange={(e) =>
                            setNewMember({ ...newMember, name: e.target.value })
                          }
                          placeholder="Name"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                          autoFocus
                        />
                        <input
                          type="email"
                          value={newMember.email}
                          onChange={(e) =>
                            setNewMember({ ...newMember, email: e.target.value })
                          }
                          placeholder="Email"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        />
                        <button
                          onClick={addMember}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setNewMember(null)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setNewMember({ groupId: group.id, name: "", email: "" })
                        }
                        className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                      >
                        + Add member
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
