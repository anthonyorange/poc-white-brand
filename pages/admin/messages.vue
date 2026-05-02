<!-- pages/admin/messages.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Messages</h1>
    <div class="divide-y divide-accent/20">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['py-5 cursor-pointer hover:bg-surface/50 px-3 rounded-xl transition-colors', !msg.read && 'bg-surface/30']"
        @click="markRead(msg)"
      >
        <div class="flex justify-between items-start mb-1">
          <p class="font-body font-medium text-primary">{{ msg.name }}</p>
          <p class="font-body text-xs text-primary/30">{{ formatDate(msg.createdAt) }}</p>
        </div>
        <p class="font-body text-xs text-primary/40 mb-2">{{ msg.email }}</p>
        <p class="font-body text-sm text-primary/70 whitespace-pre-line">{{ msg.content }}</p>
      </div>
    </div>
    <p v-if="messages.length === 0" class="text-center font-body text-primary/30 py-16">Aucun message.</p>
  </div>
</template>

<script setup lang="ts">
import { getDocs, collection, orderBy, query, updateDoc, doc } from 'firebase/firestore'
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Msg {
  id: string
  name: string
  email: string
  content: string
  read: boolean
  createdAt: any
}

const db = useFirestore()
const messages = ref<Msg[]>([])

onMounted(async () => {
  try {
    const snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')))
    messages.value = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Msg, 'id'>) }))
  } catch {
    messages.value = []
  }
})

const markRead = async (msg: Msg) => {
  if (msg.read) return
  try {
    await updateDoc(doc(db, 'messages', msg.id), { read: true })
    msg.read = true
  } catch {
    // Ignore; Firestore rules enforce authz.
  }
}

const formatDate = (ts: any): string => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
