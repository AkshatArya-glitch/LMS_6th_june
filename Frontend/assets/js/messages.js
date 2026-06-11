(function () {
  "use strict";

  const ROLE_LABELS = {
    admin: "Admin",
    trainer: "Trainer",
    user: "Student",
  };

  const DEFAULT_TABS = {
    admin: [
      { key: "new-user", label: "Message Users", targetRole: "user" },
      { key: "new-trainer", label: "Message Trainers", targetRole: "trainer" },
      { key: "all", label: "All Conversations", box: "all" },
      { key: "support", label: "Support Queries", box: "support" },
      { key: "inbox", label: "Inbox", box: "inbox" },
      { key: "sent", label: "Sent Messages", box: "sent" },
      { key: "users", label: "Users", box: "all", roleFilter: "user" },
      { key: "trainers", label: "Trainers", box: "all", roleFilter: "trainer" },
      { key: "unread", label: "Unread", box: "unread" },
    ],
    trainer: [
      { key: "new-admin", label: "Message Admin", targetRole: "admin" },
      { key: "new-user", label: "Message Students", targetRole: "user" },
      { key: "inbox", label: "Inbox", box: "inbox" },
      { key: "sent", label: "Sent Messages", box: "sent" },
    ],
    user: [
      { key: "new-admin", label: "Message Admin", targetRole: "admin" },
      { key: "new-trainer", label: "Message Trainer", targetRole: "trainer" },
      { key: "inbox", label: "Inbox", box: "inbox" },
      { key: "sent", label: "Sent Messages", box: "sent" },
    ],
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function roleLabel(role) {
    return ROLE_LABELS[role] || role || "Member";
  }

  function formatTime(value) {
    if (!value) return "";
    const normalized = String(value).replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function truncate(value, length) {
    const text = String(value ?? "").trim();
    return text.length > length ? `${text.slice(0, length - 1)}...` : text;
  }

  function defaultApiBase() {
    if (window.MESSAGES_API_BASE) return window.MESSAGES_API_BASE;
    const path = window.location.pathname || "";
    const frontendIndex = path.toLowerCase().indexOf("/frontend/");
    if (frontendIndex >= 0) {
      return `${path.slice(0, frontendIndex)}/Backend/api`;
    }
    return "../../Backend/api";
  }

  function createMessagesApp(target, options) {
    const root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) return null;

    const config = {
      role: options.role || "user",
      title: options.title || "Messages",
      subtitle: options.subtitle || "Continue role-based conversations from your LMS dashboard.",
      apiBase: String(options.apiBase || defaultApiBase()).replace(/\/$/, ""),
      csrfToken: options.csrfToken || document.querySelector('meta[name="csrf-token"]')?.content || "",
      tabs: options.tabs || DEFAULT_TABS[options.role || "user"] || DEFAULT_TABS.user,
      notify: typeof options.notify === "function" ? options.notify : function () {},
      onUnreadChange: typeof options.onUnreadChange === "function" ? options.onUnreadChange : function () {},
    };

    const state = {
      activeTab: null,
      box: "inbox",
      roleFilter: "",
      search: "",
      conversations: [],
      selectedId: "",
      receiverCache: {},
      loadingThread: false,
      searchTimer: null,
    };

    root.innerHTML = `
      <section class="messages-app messages-role-${escapeHtml(config.role)}">
        <header class="messages-head">
          <div>
            <p>${escapeHtml(roleLabel(config.role))} Portal</p>
            <h1>${escapeHtml(config.title)}</h1>
            <span>${escapeHtml(config.subtitle)}</span>
          </div>
          <button class="messages-primary" type="button" data-message-action="new">New Message</button>
        </header>
        <div class="messages-tabs" data-message-tabs></div>
        <div class="messages-layout">
          <aside class="messages-list-panel">
            <label class="messages-search">
              <span aria-hidden="true">Search</span>
              <input type="search" data-message-search placeholder="Search conversations">
            </label>
            <div class="messages-list" data-message-list>
              <div class="messages-state"><span></span><strong>Loading conversations...</strong></div>
            </div>
          </aside>
          <section class="messages-thread-panel" data-message-thread>
            ${emptyThreadHtml("Select a conversation", "Choose a conversation from the left or start a new one.")}
          </section>
        </div>
        ${modalHtml(config)}
      </section>
    `;

    const app = root.querySelector(".messages-app");
    const tabsEl = app.querySelector("[data-message-tabs]");
    const listEl = app.querySelector("[data-message-list]");
    const threadEl = app.querySelector("[data-message-thread]");

    function endpoint(name, query) {
      const url = new URL(`${config.apiBase}/${name}.php`, window.location.href);
      Object.entries(query || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
      });
      return url.toString();
    }

    async function request(name, settings) {
      const method = settings?.method || "GET";
      const opts = {
        method,
        credentials: "same-origin",
        headers: {},
      };
      if (method !== "GET") {
        opts.headers["Content-Type"] = "application/json";
        if (config.csrfToken) opts.headers["X-CSRF-Token"] = config.csrfToken;
        opts.body = JSON.stringify(settings?.data || {});
      }

      const response = await fetch(endpoint(name, settings?.query), opts);
      const text = await response.text();
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { success: false, message: text || `Request failed with ${response.status}` };
      }
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Messaging request failed.");
      }
      return payload.data || {};
    }

    function renderTabs() {
      tabsEl.innerHTML = config.tabs.map((tab) => `
        <button class="${state.activeTab === tab.key ? "active" : ""}" type="button" data-message-tab="${escapeHtml(tab.key)}">
          ${escapeHtml(tab.label)}
        </button>
      `).join("");
    }

    function setTab(tab) {
      state.activeTab = tab.key;
      state.box = tab.box || "all";
      state.roleFilter = tab.roleFilter || "";
      renderTabs();
    }

    function listState(title, message) {
      listEl.innerHTML = `<div class="messages-state"><span></span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(message || "")}</small></div>`;
    }

    function renderConversations() {
      if (!state.conversations.length) {
        listState("No conversations yet", "Start a new message to begin a thread.");
        return;
      }

      listEl.innerHTML = state.conversations.map((item) => {
        const active = item.conversation_id === state.selectedId;
        const unread = Number(item.unread_count || 0);
        const person = item.counterpart || {};
        return `
          <button class="conversation-card ${active ? "active" : ""} ${unread ? "unread" : ""}" type="button" data-message-conversation="${escapeHtml(item.conversation_id)}">
            <span class="conversation-avatar">${escapeHtml((person.name || "?").slice(0, 1).toUpperCase())}</span>
            <span class="conversation-main">
              <span class="conversation-top">
                <strong>${escapeHtml(person.name || "Conversation")}</strong>
                <time>${escapeHtml(formatTime(item.last_message_at))}</time>
              </span>
              <span class="conversation-meta">
                <em>${escapeHtml(roleLabel(person.role))}</em>
                <b>${escapeHtml(item.subject || "No subject")}</b>
              </span>
              <small>${escapeHtml(truncate(item.last_message || "No messages yet", 90))}</small>
            </span>
            ${unread ? `<span class="conversation-unread">${unread}</span>` : ""}
          </button>
        `;
      }).join("");
    }

    async function loadUnread() {
      try {
        const data = await request("unread_count");
        config.onUnreadChange(Number(data.unread_count || 0));
      } catch (_) {
        // Badge refresh should not interrupt the open conversation.
      }
    }

    async function loadConversations(selectId) {
      listState("Loading conversations...", "");
      try {
        const data = await request("get_conversations", {
          query: {
            box: state.box,
            role_filter: state.roleFilter,
            search: state.search,
          },
        });
        state.conversations = data.conversations || [];
        const preferred = selectId || state.selectedId;
        const selectedExists = state.conversations.some((item) => item.conversation_id === preferred);
        state.selectedId = selectedExists ? preferred : (state.conversations[0]?.conversation_id || "");
        renderConversations();
        if (state.selectedId) {
          await loadMessages(state.selectedId, true);
        } else {
          threadEl.innerHTML = emptyThreadHtml("No conversation selected", "Use New Message to contact an allowed recipient.");
        }
        await loadUnread();
      } catch (error) {
        listState("Unable to load conversations", error.message);
        threadEl.innerHTML = emptyThreadHtml("Messaging unavailable", error.message);
      }
    }

    function threadLoading() {
      threadEl.innerHTML = `<div class="messages-state messages-thread-state"><span></span><strong>Loading messages...</strong></div>`;
    }

    function participantTitle(thread) {
      const conversation = thread.conversation || {};
      const one = conversation.participant_one || {};
      const two = conversation.participant_two || {};
      const mineOne = one.role === config.role;
      const mineTwo = two.role === config.role;
      if (mineOne && !mineTwo) return two;
      if (mineTwo && !mineOne) return one;
      return { name: `${one.name || roleLabel(one.role)} / ${two.name || roleLabel(two.role)}`, role: "admin", email: "System conversation" };
    }

    function renderThread(thread) {
      const conversation = thread.conversation || {};
      const messages = thread.messages || [];
      const participant = participantTitle(thread);
      threadEl.innerHTML = `
        <div class="thread-head">
          <div>
            <strong>${escapeHtml(participant.name || "Conversation")}</strong>
            <span><b class="role-badge role-${escapeHtml(participant.role || "admin")}">${escapeHtml(roleLabel(participant.role))}</b>${escapeHtml(participant.email || "")}</span>
          </div>
          <small>${escapeHtml(conversation.subject || "No subject")}</small>
        </div>
        <div class="thread-messages" data-thread-scroll>
          ${messages.length ? messages.map((message) => `
            <article class="thread-message ${message.is_mine ? "mine" : "theirs"}">
              <div class="message-bubble">
                <div class="message-author">
                  <strong>${escapeHtml(message.sender?.name || roleLabel(message.sender?.role))}</strong>
                  <b class="role-badge role-${escapeHtml(message.sender?.role || "")}">${escapeHtml(roleLabel(message.sender?.role))}</b>
                </div>
                <p>${escapeHtml(message.message).replace(/\n/g, "<br>")}</p>
                <time>${escapeHtml(formatTime(message.created_at))}</time>
              </div>
            </article>
          `).join("") : `<div class="messages-state"><strong>No messages in this conversation.</strong></div>`}
        </div>
        ${conversation.can_reply ? `
          <form class="thread-reply" data-message-reply-form>
            <textarea name="message" rows="2" maxlength="5000" placeholder="Type your reply..." required></textarea>
            <button class="messages-primary" type="submit">Send</button>
          </form>
        ` : `
          <div class="thread-readonly">You can view this conversation, but only participants can reply. Start a new conversation to message a user or trainer directly.</div>
        `}
      `;

      const scroller = threadEl.querySelector("[data-thread-scroll]");
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }

    async function loadMessages(conversationId, silent) {
      if (!conversationId || state.loadingThread) return;
      state.loadingThread = true;
      state.selectedId = conversationId;
      renderConversations();
      if (!silent) threadLoading();

      try {
        const data = await request("get_messages", { query: { conversation_id: conversationId } });
        renderThread(data);
        const selected = state.conversations.find((item) => item.conversation_id === conversationId);
        if (selected && Number(selected.unread_count || 0) > 0) {
          await request("mark_as_read", {
            method: "POST",
            data: { conversation_id: conversationId, csrf_token: config.csrfToken },
          });
          selected.unread_count = 0;
          renderConversations();
          await loadUnread();
        }
      } catch (error) {
        threadEl.innerHTML = emptyThreadHtml("Unable to load messages", error.message);
      } finally {
        state.loadingThread = false;
      }
    }

    function modal() {
      return app.querySelector("[data-message-modal]");
    }

    function openModal(fixedRole) {
      const roles = DEFAULT_TABS[config.role].filter((tab) => tab.targetRole).map((tab) => tab.targetRole);
      const uniqueRoles = Array.from(new Set(roles));
      const roleSelect = app.querySelector("[data-message-field='receiver_role']");
      roleSelect.innerHTML = uniqueRoles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(roleLabel(role))}</option>`).join("");
      roleSelect.value = fixedRole || uniqueRoles[0] || "";
      roleSelect.disabled = Boolean(fixedRole);
      app.querySelector("[data-message-field='subject']").value = "";
      app.querySelector("[data-message-field='message']").value = "";
      app.querySelector("[data-message-form-error]").textContent = "";
      modal().classList.remove("hidden");
      loadReceivers(roleSelect.value);
    }

    function closeModal() {
      modal().classList.add("hidden");
    }

    async function loadReceivers(role) {
      const receiverSelect = app.querySelector("[data-message-field='receiver_id']");
      receiverSelect.innerHTML = `<option value="">Loading ${escapeHtml(roleLabel(role))}...</option>`;
      receiverSelect.disabled = true;

      try {
        if (!state.receiverCache[role]) {
          const data = await request("get_receivers", { query: { role } });
          state.receiverCache[role] = data.receivers || [];
        }
        const rows = state.receiverCache[role];
        receiverSelect.innerHTML = rows.length
          ? rows.map((receiver) => `<option value="${Number(receiver.id)}">${escapeHtml(receiver.name)}${receiver.email ? ` - ${escapeHtml(receiver.email)}` : ""}</option>`).join("")
          : `<option value="">No allowed ${escapeHtml(roleLabel(role).toLowerCase())} recipients found</option>`;
        receiverSelect.disabled = !rows.length;
      } catch (error) {
        receiverSelect.innerHTML = `<option value="">${escapeHtml(error.message)}</option>`;
        receiverSelect.disabled = true;
      }
    }

    async function submitNewMessage(form) {
      const button = form.querySelector("button[type='submit']");
      const error = app.querySelector("[data-message-form-error]");
      const receiverRole = app.querySelector("[data-message-field='receiver_role']").value;
      const receiverId = Number(app.querySelector("[data-message-field='receiver_id']").value || 0);
      const subject = app.querySelector("[data-message-field='subject']").value.trim();
      const message = app.querySelector("[data-message-field='message']").value.trim();

      error.textContent = "";
      if (!receiverRole || !receiverId || !message) {
        error.textContent = "Choose a receiver and enter a message.";
        return;
      }

      button.disabled = true;
      try {
        const data = await request("send_message", {
          method: "POST",
          data: {
            receiver_role: receiverRole,
            receiver_id: receiverId,
            subject,
            message,
            csrf_token: config.csrfToken,
          },
        });
        closeModal();
        config.notify("Message sent successfully.", "success");
        const afterSendTab = config.tabs.find((tab) => !tab.targetRole && tab.box === "sent")
          || config.tabs.find((tab) => !tab.targetRole && tab.box === "all");
        if (afterSendTab) setTab(afterSendTab);
        state.search = "";
        const searchInput = app.querySelector("[data-message-search]");
        if (searchInput) searchInput.value = "";
        await loadConversations(data.conversation_id);
      } catch (err) {
        error.textContent = err.message;
        config.notify(err.message, "error");
      } finally {
        button.disabled = false;
      }
    }

    async function submitReply(form) {
      const textarea = form.querySelector("textarea[name='message']");
      const button = form.querySelector("button[type='submit']");
      const message = textarea.value.trim();
      if (!message || !state.selectedId) return;

      button.disabled = true;
      try {
        await request("send_message", {
          method: "POST",
          data: {
            conversation_id: state.selectedId,
            message,
            csrf_token: config.csrfToken,
          },
        });
        textarea.value = "";
        config.notify("Reply sent.", "success");
        await loadConversations(state.selectedId);
      } catch (error) {
        config.notify(error.message, "error");
      } finally {
        button.disabled = false;
      }
    }

    function bind() {
      renderTabs();
      const firstFilterTab = config.tabs.find((tab) => !tab.targetRole) || config.tabs[0];
      if (firstFilterTab && !firstFilterTab.targetRole) setTab(firstFilterTab);

      app.addEventListener("click", (event) => {
        const action = event.target.closest("[data-message-action]");
        if (action) {
          if (action.dataset.messageAction === "new") openModal();
          if (action.dataset.messageAction === "close-modal") closeModal();
          return;
        }

        const tabButton = event.target.closest("[data-message-tab]");
        if (tabButton) {
          const tab = config.tabs.find((item) => item.key === tabButton.dataset.messageTab);
          if (!tab) return;
          if (tab.targetRole) {
            openModal(tab.targetRole);
            return;
          }
          setTab(tab);
          loadConversations();
          return;
        }

        const card = event.target.closest("[data-message-conversation]");
        if (card) {
          loadMessages(card.dataset.messageConversation);
        }
      });

      modal().addEventListener("click", (event) => {
        if (event.target === modal()) closeModal();
      });

      app.querySelector("[data-message-search]").addEventListener("input", (event) => {
        state.search = event.target.value.trim();
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => loadConversations(), 250);
      });

      app.querySelector("[data-message-field='receiver_role']").addEventListener("change", (event) => {
        loadReceivers(event.target.value);
      });

      app.addEventListener("submit", (event) => {
        const newForm = event.target.closest("[data-message-new-form]");
        if (newForm) {
          event.preventDefault();
          submitNewMessage(newForm);
          return;
        }

        const replyForm = event.target.closest("[data-message-reply-form]");
        if (replyForm) {
          event.preventDefault();
          submitReply(replyForm);
        }
      });
    }

    bind();
    loadConversations();

    return {
      reload: () => loadConversations(),
      unread: () => loadUnread(),
    };
  }

  function emptyThreadHtml(title, message) {
    return `
      <div class="messages-empty-thread">
        <div class="messages-empty-icon">M</div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }

  function modalHtml(config) {
    return `
      <div class="messages-modal hidden" data-message-modal>
        <div class="messages-modal-card" role="dialog" aria-modal="true" aria-label="New message">
          <div class="messages-modal-head">
            <div>
              <strong>Start New Conversation</strong>
              <span>Select an allowed receiver for your ${escapeHtml(roleLabel(config.role).toLowerCase())} account.</span>
            </div>
            <button type="button" data-message-action="close-modal" aria-label="Close">x</button>
          </div>
          <form class="messages-form" data-message-new-form>
            <label>
              Receiver Role
              <select data-message-field="receiver_role"></select>
            </label>
            <label>
              Receiver
              <select data-message-field="receiver_id"></select>
            </label>
            <label>
              Subject
              <input type="text" data-message-field="subject" maxlength="255" placeholder="Payment, course doubt, support query...">
            </label>
            <label>
              Message
              <textarea data-message-field="message" rows="5" maxlength="5000" placeholder="Write your message..." required></textarea>
            </label>
            <div class="messages-form-error" data-message-form-error></div>
            <div class="messages-modal-actions">
              <button class="messages-secondary" type="button" data-message-action="close-modal">Cancel</button>
              <button class="messages-primary" type="submit">Send Message</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  window.EEPLMessages = {
    mount: createMessagesApp,
  };
})();
