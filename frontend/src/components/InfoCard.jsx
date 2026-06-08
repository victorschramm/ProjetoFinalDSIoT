import React from 'react';

const InfoCard = ({ label, value }) => {
  return (
    <div className="info-card">
      <label>{label}</label>
      <span>{value || 'N/A'}</span>
    </div>
  );
};

export default InfoCard;
