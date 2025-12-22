<template>
  <div :class="cn('p-3', className)">
    <div class="flex items-center justify-between mb-4">
      <button @click="previousMonth" class="h-7 w-7 rounded-md border bg-transparent p-0 opacity-50 hover:opacity-100">
        <ChevronLeft class="h-4 w-4" />
      </button>
      <div class="text-sm font-medium">{{ currentMonthLabel }}</div>
      <button @click="nextMonth" class="h-7 w-7 rounded-md border bg-transparent p-0 opacity-50 hover:opacity-100">
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div v-for="day in weekDays" :key="day" class="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center">
        {{ day }}
      </div>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="day in days"
        :key="day.date"
        @click="$emit('select', day.date)"
        :class="cn(
          'h-9 w-9 rounded-md text-sm font-normal hover:bg-accent hover:text-accent-foreground',
          day.isSelected && 'bg-primary text-primary-foreground',
          day.isToday && 'bg-accent text-accent-foreground',
          day.isOtherMonth && 'text-muted-foreground opacity-50'
        )"
      >
        {{ day.day }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns'

interface Props {
  selected?: Date
  className?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [date: Date]
}>()

const currentDate = ref(props.selected || new Date())

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const currentMonthLabel = computed(() => format(currentDate.value, 'MMMM yyyy'))

const days = computed(() => {
  const start = startOfMonth(currentDate.value)
  const end = endOfMonth(currentDate.value)
  const allDays = eachDayOfInterval({ start, end })
  
  // Add days from previous month to fill the week
  const firstDay = start.getDay()
  const prevMonthDays = []
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(start)
    date.setDate(date.getDate() - i - 1)
    prevMonthDays.push({
      date,
      day: date.getDate(),
      isOtherMonth: true,
      isSelected: props.selected && isSameDay(date, props.selected),
      isToday: isToday(date)
    })
  }
  
  const currentMonthDays = allDays.map(date => ({
    date,
    day: date.getDate(),
    isOtherMonth: false,
    isSelected: props.selected && isSameDay(date, props.selected),
    isToday: isToday(date)
  }))
  
  // Add days from next month to fill the week
  const lastDay = end.getDay()
  const nextMonthDays = []
  for (let i = 1; i <= 6 - lastDay; i++) {
    const date = new Date(end)
    date.setDate(date.getDate() + i)
    nextMonthDays.push({
      date,
      day: date.getDate(),
      isOtherMonth: true,
      isSelected: props.selected && isSameDay(date, props.selected),
      isToday: isToday(date)
    })
  }
  
  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
})

const previousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1)
}

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1)
}
</script>

