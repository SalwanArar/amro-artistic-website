function IntroButton({setMode,mode, isActive, label, icon, labelText}) {
    return (
        <button
          className={'intro__btn'}
          onClick={() => setMode(mode)}
          aria-pressed={isActive}
          aria-label={label}
        >
          {/* icon component */}
          <svg className="intro__btn-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {icon}
          </svg>
          <span>{labelText}</span>
        </button>
    );
}

export default IntroButton;