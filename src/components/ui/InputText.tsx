import type {
  ChangeEvent, FormEvent, RefObject,
} from 'react';
import type { FC } from '../../lib/teact/teact';
import React, { memo } from '../../lib/teact/teact';

import buildClassName from '../../util/buildClassName';

import useOldLang from '../../hooks/useOldLang';

type OwnProps = {
  ref?: RefObject<HTMLInputElement>;
  id?: string;
  className?: string;
  value?: string;
  label?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  tabIndex?: number;
  teactExperimentControlled?: boolean;
  inputMode?: 'text' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  withIconButton?: boolean;
  iconSrc?: string;
  onIconClick?: () => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onInput?: (e: FormEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
};

const InputText: FC<OwnProps> = ({
  ref,
  id,
  className,
  value,
  label,
  error,
  success,
  disabled,
  readOnly,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  tabIndex,
  teactExperimentControlled,
  withIconButton = false,
  iconSrc,
  onIconClick,
  onChange,
  onInput,
  onKeyPress,
  onKeyDown,
  onBlur,
  onPaste,
}) => {
  const lang = useOldLang();
  const labelText = error || success || label;
  const fullClassName = buildClassName(
    'input-group',
    value && 'touched',
    error ? 'error' : success && 'success',
    disabled && 'disabled',
    readOnly && 'disabled',
    labelText && 'with-label',
    withIconButton && 'with-icon',
    className,
  );

  return (
    <div className={fullClassName} dir={lang.isRtl ? 'rtl' : undefined}>
      <div className={buildClassName('input-button', 'input-wrapper')}>
        <input
          ref={ref}
          className="form-control"
          type="text"
          id={id}
          dir="auto"
          value={value || ''}
          tabIndex={tabIndex}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          readOnly={readOnly}
          onChange={onChange}
          onInput={onInput}
          onKeyPress={onKeyPress}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onPaste={onPaste}
          aria-label={labelText}
          teactExperimentControlled={teactExperimentControlled}
        />
        {withIconButton && (
          <button
            type="button"
            className={buildClassName('input-button', 'input-icon-button')}
            onClick={onIconClick}
            tabIndex={-1}
            aria-label="Select emoji"
          >
            <img
              src={iconSrc}
              alt=""
              className={buildClassName('input-button', 'input-icon')}
            />
          </button>
        )}
      </div>
      {labelText && (
        <label htmlFor={id}>{labelText}</label>
      )}
    </div>
  );
};

export default memo(InputText);
