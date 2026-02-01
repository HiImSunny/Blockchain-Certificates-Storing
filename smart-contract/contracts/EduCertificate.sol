// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EduCertificate {
    address public admin;

    struct Certificate {
        uint256 certId;
        address issuer;
        bytes32 certHash;
        uint256 issuedAt;
        bool revoked;
    }

    mapping(uint256 => Certificate) private certificates;
    mapping(address => bool) public officers;
    uint256 public nextCertId = 1;

    event OfficerAdded(address officer);
    event OfficerRemoved(address officer);

    event CertificateIssued(
        uint256 indexed certId,
        address indexed issuer,
        bytes32 certHash
    );

    event CertificateUpdated(
        uint256 indexed certId,
        bytes32 newHash
    );

    event CertificateRevoked(uint256 indexed certId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyOfficerOrAdmin() {
        require(
            msg.sender == admin || officers[msg.sender],
            "Not authorized"
        );
        _;
    }

    modifier onlyOwnerOfCert(uint256 certId) {
        require(
            certificates[certId].issuer == msg.sender ||
                msg.sender == admin,
            "Not cert owner"
        );
        _;
    }

    constructor(address _admin) {
        admin = _admin;
    }

    function addOfficer(address officer) external onlyAdmin {
        officers[officer] = true;
        emit OfficerAdded(officer);
    }

    function removeOfficer(address officer) external onlyAdmin {
        officers[officer] = false;
        emit OfficerRemoved(officer);
    }

    function issueCertificate(bytes32 certHash)
        external
        onlyOfficerOrAdmin
        returns (uint256)
    {
        uint256 certId = nextCertId;

        certificates[certId] = Certificate({
            certId: certId,
            issuer: msg.sender,
            certHash: certHash,
            issuedAt: block.timestamp,
            revoked: false
        });

        nextCertId++;

        emit CertificateIssued(certId, msg.sender, certHash);
        return certId;
    }

    function updateCertificate(uint256 certId, bytes32 newHash)
        external
        onlyOwnerOfCert(certId)
    {
        require(!certificates[certId].revoked, "Certificate revoked");
        certificates[certId].certHash = newHash;

        emit CertificateUpdated(certId, newHash);
    }

    function revokeCertificate(uint256 certId)
        external
        onlyOwnerOfCert(certId)
    {
        certificates[certId].revoked = true;
        emit CertificateRevoked(certId);
    }

    function verifyCertificate(uint256 certId, bytes32 hashToVerify)
        external
        view
        returns (bool valid, bool revoked)
    {
        Certificate memory cert = certificates[certId];

        if (cert.certId == 0) {
            return (false, false);
        }

        valid = cert.certHash == hashToVerify;
        revoked = cert.revoked;
    }

    function getCertificate(uint256 certId)
        external
        view
        returns (
            address issuer,
            bytes32 certHash,
            uint256 issuedAt,
            bool revoked
        )
    {
        Certificate memory cert = certificates[certId];
        return (
            cert.issuer,
            cert.certHash,
            cert.issuedAt,
            cert.revoked
        );
    }
}
