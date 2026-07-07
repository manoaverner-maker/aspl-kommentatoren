// Kompakte Form-Anzeige: letzte n Ergebnisse als farbige Platz-Chips.
export default function FormChips({ form }) {
  if (!form || form.length === 0) return <span className="form-leer">—</span>
  return (
    <span className="form-chips">
      {form.map((f, i) => (
        <span
          key={i}
          className={'fc ' + (f.platz === 1 ? 'p1' : f.platz <= 3 ? 'pod' : f.platz <= 10 ? 'pts' : 'rest')}
          title={f.runde}
        >
          {f.platz}
        </span>
      ))}
    </span>
  )
}
