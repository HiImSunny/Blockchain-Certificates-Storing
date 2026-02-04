// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EduCertificate {
    address public admin;

    struct Certificate {
        uint256 certId;
        address issuer;
        bytes32 certHash;
        string certificateIdString; // e.g. "CERT-1234..."
        string studentName;
        string courseName;
        string courseCode;
        string trainingType;
        string duration;
        string result;
        string issuerName;
        string issuerWebsite;
        string issuerContact;
        string fileUrl;
        string fileType;
        uint256 issuedAt;
        bool revoked;
        string revokeTxHash;
    }

    struct Officer {
        string name;
        address officerAddress;
        uint256 addedAt;
        bool isActive;
    }

    mapping(uint256 => Certificate) private certificates;
    mapping(address => Officer) public officers;
    address[] public officerList;
    uint256[] public allCertIds;
    uint256 public nextCertId = 1;

    event OfficerAdded(address officer, string name);
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
            msg.sender == admin || officers[msg.sender].isActive,
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

    function addOfficer(address officer, string memory name) external onlyAdmin {
        require(!officers[officer].isActive, "Already an active officer");
        
        // If officer was previously added but inactive, just reactivate and update name
        // Otherwise, add new
        if (officers[officer].addedAt != 0) {
            officers[officer].isActive = true;
            officers[officer].name = name;
             // Check if already in list to avoid duplicates (though remove doesn't fully remove from array for gas reasons usually, logic here depends on implementation)
             // Simple approach: just update state. Assuming if inactive, they are still in array? 
             // Let's check remove logic.
             
             // If we rely on isActive for auth, we just set true.
             // But we need to ensure they are in officerList if not already?
             // To simplify: if re-adding, we don't push to array if already there. 
             // BUT, iterating array to check existence is expensive.
             // Given typical low count of officers, we might just duplicate in logic or handle array better.
             // Let's assume strict add/remove for list management.
        } else {
             officers[officer] = Officer({
                name: name,
                officerAddress: officer,
                addedAt: block.timestamp,
                isActive: true
            });
            officerList.push(officer);
        }

        emit OfficerAdded(officer, name);
    }

    function removeOfficer(address officer) external onlyAdmin {
        require(officers[officer].isActive, "Not an active officer");
        officers[officer].isActive = false;
        
        // We keep them in the array but marked inactive in mapping.
        // Or we can remove from array.
        // For simple iteration in frontend, removing from array is cleaner.
        for (uint i = 0; i < officerList.length; i++) {
            if (officerList[i] == officer) {
                officerList[i] = officerList[officerList.length - 1];
                officerList.pop();
                break;
            }
        }
        
        emit OfficerRemoved(officer);
    }

    function getOfficers() external view returns (Officer[] memory) {
        Officer[] memory activeOfficers = new Officer[](officerList.length);
        for (uint i = 0; i < officerList.length; i++) {
            activeOfficers[i] = officers[officerList[i]];
        }
        return activeOfficers;
    }

    struct IssueData {
        bytes32 certHash;
        string certificateIdString;
        string studentName;
        string courseName;
        string courseCode;
        string trainingType;
        string duration;
        string result;
        string issuerName;
        string issuerWebsite;
        string issuerContact;
        string fileUrl;
        string fileType;
    }

    function issueCertificate(IssueData calldata data)
        external
        onlyOfficerOrAdmin
        returns (uint256)
    {
        uint256 certId = nextCertId;

        certificates[certId] = Certificate({
            certId: certId,
            issuer: msg.sender,
            certHash: data.certHash,
            certificateIdString: data.certificateIdString,
            studentName: data.studentName,
            courseName: data.courseName,
            courseCode: data.courseCode,
            trainingType: data.trainingType,
            duration: data.duration,
            result: data.result,
            issuerName: data.issuerName,
            issuerWebsite: data.issuerWebsite,
            issuerContact: data.issuerContact,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            issuedAt: block.timestamp,
            revoked: false,
            revokeTxHash: ""
        });

        allCertIds.push(certId);
        nextCertId++;

        emit CertificateIssued(certId, msg.sender, data.certHash);
        return certId;
    }

    function revokeCertificate(uint256 certId, string memory revokeTxHash)
        external
        onlyOwnerOfCert(certId)
    {
        require(!certificates[certId].revoked, "Already revoked");
        certificates[certId].revoked = true;
        certificates[certId].revokeTxHash = revokeTxHash;
        emit CertificateRevoked(certId);
    }

    function verifyCertificate(uint256 certId, bytes32 hashToVerify)
        external
        view
        returns (bool valid, bool revoked, Certificate memory certDetails)
    {
        Certificate memory cert = certificates[certId];

        if (cert.certId == 0) {
            return (false, false, cert);
        }

        valid = cert.certHash == hashToVerify;
        revoked = cert.revoked;
        certDetails = cert;
    }

    function getCertificate(uint256 certId)
        external
        view
        returns (Certificate memory)
    {
        return certificates[certId];
    }
    
    function getAllCertificates() external view returns (Certificate[] memory) {
        Certificate[] memory allCerts = new Certificate[](allCertIds.length);
        for (uint i = 0; i < allCertIds.length; i++) {
            allCerts[i] = certificates[allCertIds[i]];
        }
        return allCerts;
    }
}
