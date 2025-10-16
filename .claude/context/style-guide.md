# Accuro Style Guide - Tailwind Implementation

## Tailwind Setup
- Version: 3.4.3
- Approach: Utility-first, component-based in React
- PostCSS: Configured for production optimization

## Common Tailwind Patterns

### Hero Section
```tsx
<section className="bg-slate-900 text-white py-20 md:py-32 px-4">
  <div className="max-w-6xl mx-auto">
    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
      Main Headline
    </h1>
    <p className="text-xl text-gray-300 mb-8 max-w-2xl">
      Supporting description
    </p>
    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
      Call to Action
    </button>
  </div>
</section>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
      <p className="text-gray-600">{item.description}</p>
    </div>
  ))}
</div>
```

### Form Input
```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
  placeholder="Enter text"
/>
```

### Responsive Patterns
- Mobile first: base styles → md: → lg:
- Images: w-full h-auto for responsiveness
- Text sizing: text-base md:text-lg lg:text-xl
