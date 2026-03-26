import React from 'react';

type Props = {
  title: string;
  label: string;
  onClick: () => void;
  style?: React.CSSProperties;
};

const ShopMetaButton: React.FC<Props> = ({ title, label, onClick, style }) => {
  return (
    <button type="button" style={style} onClick={onClick} title={title}>
      {label}
    </button>
  );
};

export default ShopMetaButton;
