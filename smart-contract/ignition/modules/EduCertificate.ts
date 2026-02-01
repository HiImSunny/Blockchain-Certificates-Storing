import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ADMIN_ADDRESS = "0x881708706f250882CD5AC6E5D6C566B2ca8306b7";

const EduCertificateModule = buildModule("EduCertificateModule", (m) => {
  const eduCertificate = m.contract("EduCertificate", [ADMIN_ADDRESS]);

  return { eduCertificate };
});

export default EduCertificateModule;
