const express = require('express');
const db = require('../utils/fileDb');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth('user'));

/* Start (or reuse) a conversation about one item, between the logged-in
   user and the person who posted that item. This is what the "Chat with
   poster" button on the item detail page calls. */
router.post('/start', async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: 'itemId is required.' });

    const item = db.findById('items', itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    if (item.userId === req.user.userId) {
      return res.status(400).json({ message: "You can't start a chat with yourself about your own item." });
    }

    const me = req.user.userId;
    const other = item.userId;

    let convo = db.findOne(
      'conversations',
      (c) => c.itemId === itemId && c.participants.includes(me) && c.participants.includes(other)
    );

    if (!convo) {
      const otherUser = db.findById('users', other);
      convo = await db.insert('conversations', {
        itemId,
        itemTitle: item.title,
        itemPhoto: item.photo || null,
        participants: [me, other],
        participantNames: { [me]: req.user.name, [other]: otherUser ? otherUser.name : 'User' },
        lastMessage: '',
        lastMessageAt: null,
        lastMessageSenderId: null,
        readAt: { [me]: new Date().toISOString() },
      });
    }

    res.status(201).json(convo);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* All of my conversations, newest activity first, with an unread count each */
router.get('/conversations', (req, res) => {
  const me = req.user.userId;
  const convos = db.findMany('conversations', (c) => c.participants.includes(me));

  const result = convos
    .map((c) => {
      const otherId = c.participants.find((p) => p !== me);
      const myReadAt = (c.readAt && c.readAt[me]) || null;
      const unread = db.findMany(
        'messages',
        (m) => m.conversationId === c.id && m.senderId !== me && (!myReadAt || new Date(m.createdAt) > new Date(myReadAt))
      ).length;

      return {
        id: c.id,
        itemId: c.itemId,
        itemTitle: c.itemTitle,
        itemPhoto: c.itemPhoto,
        otherName: c.participantNames?.[otherId] || 'User',
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        lastMessageIsMine: c.lastMessageSenderId === me,
        unread,
        updatedAt: c.lastMessageAt || c.createdAt,
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json(result);
});

/* Total unread messages across all my conversations - for the navbar badge */
router.get('/unread-count', (req, res) => {
  const me = req.user.userId;
  const convos = db.findMany('conversations', (c) => c.participants.includes(me));
  let count = 0;
  for (const c of convos) {
    const myReadAt = (c.readAt && c.readAt[me]) || null;
    count += db.findMany(
      'messages',
      (m) => m.conversationId === c.id && m.senderId !== me && (!myReadAt || new Date(m.createdAt) > new Date(myReadAt))
    ).length;
  }
  res.json({ count });
});

/* One conversation's messages. Also marks it as read for me. */
router.get('/conversations/:id/messages', async (req, res) => {
  const me = req.user.userId;
  const convo = db.findById('conversations', req.params.id);
  if (!convo) return res.status(404).json({ message: 'Conversation not found.' });
  if (!convo.participants.includes(me)) return res.status(403).json({ message: 'Not your conversation.' });

  const messages = db
    .findMany('messages', (m) => m.conversationId === convo.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  await db.updateById('conversations', convo.id, {
    readAt: { ...(convo.readAt || {}), [me]: new Date().toISOString() },
  });

  const otherId = convo.participants.find((p) => p !== me);
  res.json({
    messages,
    itemId: convo.itemId,
    itemTitle: convo.itemTitle,
    otherName: convo.participantNames?.[otherId] || 'User',
  });
});

/* Send a message in a conversation I'm part of */
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const me = req.user.userId;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message cannot be empty.' });

    const convo = db.findById('conversations', req.params.id);
    if (!convo) return res.status(404).json({ message: 'Conversation not found.' });
    if (!convo.participants.includes(me)) return res.status(403).json({ message: 'Not your conversation.' });

    const message = await db.insert('messages', {
      conversationId: convo.id,
      senderId: me,
      senderName: req.user.name,
      text: text.trim(),
    });

    await db.updateById('conversations', convo.id, {
      lastMessage: message.text,
      lastMessageAt: message.createdAt,
      lastMessageSenderId: me,
      readAt: { ...(convo.readAt || {}), [me]: message.createdAt },
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
