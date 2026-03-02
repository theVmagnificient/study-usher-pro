import type { ReportTemplate } from '@/data/reportTemplates'

interface Props {
  show: boolean
  templates: ReportTemplate[]
  activeIndex: number
  emptyText: string
  onSelect: (template: ReportTemplate) => void
  onHoverIndex: (index: number) => void
}

export function TemplatePopup({ show, templates, activeIndex, emptyText, onSelect, onHoverIndex }: Props) {
  if (!show || templates.length === 0) return null

  return (
    <div
      data-template-popup
      className="absolute z-50 mt-1 max-h-48 w-64 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1"
      style={{ top: '100%', left: '0' }}
    >
      <ul role="listbox">
        {templates.map((template, index) => (
          <li
            key={template.id}
            role="option"
            aria-selected={index === activeIndex}
            className={[
              'px-3 py-2 text-sm cursor-pointer rounded-sm',
              index === activeIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground',
            ].join(' ')}
            onClick={() => onSelect(template)}
            onMouseEnter={() => onHoverIndex(index)}
          >
            {template.label}
          </li>
        ))}
      </ul>
      {templates.length === 0 && (
        <p className="px-3 py-2 text-sm text-muted-foreground italic">{emptyText}</p>
      )}
    </div>
  )
}
