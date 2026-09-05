function SymbolBar({ title, symbols, addSymbol }) {
  return (
    <div className="symbol-section">
      <div className="symbol-grid">

        {symbols.map((item, index) => (
          <button
            key={index}
            className="symbol-chip"
            onClick={() => addSymbol(item.symbol)}
            title={item.label}
          >
            <span>{item.symbol}</span>
            <small>{item.label}</small>
          </button>
        ))}

      </div>

    </div>
  );
}

export default SymbolBar;