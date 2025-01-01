const CertificateListItem = ({ certificate }) => {
    const {meritCertificate, tournamentDates, tournamentName} = certificate ?? {};

    return (
      <li
        className="px-3 py-5 flex justify-between text-white items-center"
        style={{ borderBottom: "1px solid #5a5a5a " }}
      >
        <div>
          <div className="text-sm">{tournamentName}</div>
          <div className="text-xs">{tournamentDates}</div>
        </div>
        <a
          className="text-xs text-primary-yellow underline underline-primary-yellow"
          href={meritCertificate}
          target="_blank"
          rel="noreferrer"
        >
          Download
        </a>
      </li>
    );
};

export default CertificateListItem;