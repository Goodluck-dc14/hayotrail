// Sources flattened with hardhat v2.29.1 https://hardhat.org

// SPDX-License-Identifier: MIT
//
// HayoTrail, flattened into one file for Remix IDE (remix.ethereum.org).
// Generated with: npx hardhat flatten contracts/HayoTrail.sol
// Compile with Solidity 0.8.24. The original source is contracts/HayoTrail.sol.

// File @openzeppelin/contracts/access/IAccessControl.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (access/IAccessControl.sol)

pragma solidity ^0.8.20;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}


// File @openzeppelin/contracts/utils/Context.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/introspection/IERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/utils/introspection/ERC165.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File @openzeppelin/contracts/access/AccessControl.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;



/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` to `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}


// File @openzeppelin/contracts/utils/Pausable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File contracts/HayoTrail.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;


/**
 * @title  HayoTrail
 * @author Ihuoma Goodluck Ogbonna (HayoHealth)
 * @notice A tamper-proof audit trail for health insurance claims.
 *
 * The problem: when a clinic bills an insurer, nobody can later prove that the
 * patient was really there, that the bill was not changed, or what the insurer
 * was told before it paid. Each side keeps its own records and can edit them.
 *
 * HayoTrail records four moments of every claim on Ethereum, where nobody can
 * quietly change them afterwards:
 *   1. VERIFIER (HayoHealth) records that the patient's identity was checked at the clinic.
 *   2. PROVIDER (the clinic) submits the bill. Only its SHA-256 fingerprint goes on-chain.
 *   3. VERIFIER (HayoHealth) clears the bill, or flags it with a reason and evidence.
 *   4. INSURER approves or rejects it. That decision is final.
 *
 * Design rules:
 *   - No patient data on-chain. A patient only appears as a hashed member token,
 *     and a bill only as the hash of its document.
 *   - The contract never moves money. It only keeps the record that everyone trusts.
 *   - A flag means "anomaly for review", never "fraud". A human insurer always decides.
 */
contract HayoTrail is AccessControl, Pausable {
    /* ------------------------------------------------------------------ */
    /*                               Roles                                 */
    /* ------------------------------------------------------------------ */

    /// @notice HayoHealth's screening engine: records identity checks and screening results.
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    /// @notice A registered clinic or hospital that can submit bills.
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    /// @notice A registered health insurer that sets tariffs and makes final decisions.
    bytes32 public constant INSURER_ROLE = keccak256("INSURER_ROLE");

    /* ------------------------------------------------------------------ */
    /*                           Types and storage                         */
    /* ------------------------------------------------------------------ */

    /// @notice Where a claim is in its life. The numbers matter: Etherscan shows them as 0 to 5.
    enum ClaimStatus {
        None,      // 0: no claim with this hash
        Submitted, // 1: clinic has sent the bill, waiting for screening
        Cleared,   // 2: HayoHealth found nothing wrong
        Flagged,   // 3: HayoHealth (or the tariff check) found an anomaly
        Approved,  // 4: insurer accepted the bill (final)
        Rejected   // 5: insurer refused the bill (final)
    }

    /// @notice Why a claim was flagged. Maps to the fraud patterns HayoHealth looks for.
    enum FlagReason {
        None,               // 0
        IdentityMismatch,   // 1: card used by someone else (card sharing)
        DuplicateService,   // 2: the same service billed again under a new document
        TariffViolation,    // 3: amount above the price agreed with the insurer
        ClinicalMismatch,   // 4: treatment does not fit the diagnosis
        Other               // 5
    }

    /// @notice A verified clinic visit (moment 1).
    struct Visit {
        bytes32 memberToken;  // hashed, pseudonymous member ID. Never a name or card number.
        address provider;     // the clinic where the patient was verified
        address insurer;      // the patient's insurer
        uint64 verifiedAt;    // block timestamp of the identity check
        bool claimed;         // true once a bill has been submitted for this visit
    }

    /// @notice A bill and everything that happened to it (moments 2 to 4).
    struct Claim {
        bytes32 visitId;      // the verified visit this bill belongs to
        bytes32 procedureCode;// e.g. keccak256("CONSULT-GP")
        uint256 amount;       // billed amount in Rwandan francs (RWF)
        address provider;     // clinic that submitted it
        address insurer;      // insurer that must decide
        ClaimStatus status;
        FlagReason flagReason;
        bytes32 evidenceHash; // hash of the evidence behind a flag (0 if none)
        uint64 submittedAt;
        uint64 screenedAt;
        uint64 decidedAt;
    }

    /// @notice Running totals per clinic, so anyone can see its track record.
    struct ProviderStats {
        uint32 submitted;
        uint32 flagged;
        uint32 approved;
        uint32 rejected;
    }

    /// @notice Human-readable names for registered parties.
    mapping(address => string) public partyName;

    /// @notice visitId => verified visit
    mapping(bytes32 => Visit) private _visits;

    /// @notice SHA-256 hash of the bill document => claim. One document can only be billed once.
    mapping(bytes32 => Claim) private _claims;

    /// @notice insurer => procedure code => maximum agreed price in RWF (0 = no tariff set)
    mapping(address => mapping(bytes32 => uint256)) public tariffOf;

    /// @notice clinic => running totals
    mapping(address => ProviderStats) private _providerStats;

    /// @notice Total numbers, handy for dashboards.
    uint256 public totalVisits;
    uint256 public totalClaims;

    /* ------------------------------------------------------------------ */
    /*                                Events                               */
    /* ------------------------------------------------------------------ */

    event ProviderRegistered(address indexed provider, string name);
    event InsurerRegistered(address indexed insurer, string name);
    event TariffSet(address indexed insurer, bytes32 indexed procedureCode, uint256 maxAmount);
    event VisitVerified(bytes32 indexed visitId, bytes32 indexed memberToken, address indexed provider, address insurer);
    event ClaimSubmitted(bytes32 indexed claimHash, bytes32 indexed visitId, address indexed provider, bytes32 procedureCode, uint256 amount);
    event ClaimCleared(bytes32 indexed claimHash, address indexed verifier);
    event ClaimFlagged(bytes32 indexed claimHash, FlagReason reason, bytes32 evidenceHash, address indexed flaggedBy);
    event ClaimDecided(bytes32 indexed claimHash, bool approved, address indexed insurer);

    /* ------------------------------------------------------------------ */
    /*                                Errors                               */
    /* ------------------------------------------------------------------ */

    error ZeroAddress();
    error ZeroValue();
    error NotAnInsurer(address account);
    error NotAProvider(address account);
    error VisitAlreadyRecorded(bytes32 visitId);
    error VisitNotFound(bytes32 visitId);
    error VisitAlreadyClaimed(bytes32 visitId);
    error WrongProvider(bytes32 visitId, address caller);
    error ClaimAlreadyExists(bytes32 claimHash);
    error ClaimNotFound(bytes32 claimHash);
    error InvalidStatus(bytes32 claimHash, ClaimStatus current);
    error InvalidFlagReason();
    error WrongInsurer(bytes32 claimHash, address caller);

    /* ------------------------------------------------------------------ */
    /*                              Constructor                            */
    /* ------------------------------------------------------------------ */

    /// @param admin The HayoHealth admin wallet. It can register parties and pause the contract,
    ///              and it also gets the VERIFIER_ROLE so it can record checks from day one.
    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    /* ------------------------------------------------------------------ */
    /*                      Admin: registering parties                     */
    /* ------------------------------------------------------------------ */

    /// @notice Register a clinic so it can submit bills. Only the admin can do this.
    function registerProvider(address provider, string calldata name) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (provider == address(0)) revert ZeroAddress();
        partyName[provider] = name;
        _grantRole(PROVIDER_ROLE, provider);
        emit ProviderRegistered(provider, name);
    }

    /// @notice Register an insurer so it can set tariffs and decide on claims.
    function registerInsurer(address insurer, string calldata name) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (insurer == address(0)) revert ZeroAddress();
        partyName[insurer] = name;
        _grantRole(INSURER_ROLE, insurer);
        emit InsurerRegistered(insurer, name);
    }

    /// @notice Emergency stop. While paused, no new visits, bills, screenings or decisions.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Resume normal operation after an emergency stop.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /* ------------------------------------------------------------------ */
    /*                        Insurer: agreed prices                       */
    /* ------------------------------------------------------------------ */

    /// @notice An insurer records the maximum price it agreed to pay for a procedure.
    ///         Bills above this are flagged automatically when they are submitted.
    function setTariff(bytes32 procedureCode, uint256 maxAmount) external onlyRole(INSURER_ROLE) {
        if (procedureCode == bytes32(0) || maxAmount == 0) revert ZeroValue();
        tariffOf[msg.sender][procedureCode] = maxAmount;
        emit TariffSet(msg.sender, procedureCode, maxAmount);
    }

    /* ------------------------------------------------------------------ */
    /*                  Moment 1: identity checked at clinic               */
    /* ------------------------------------------------------------------ */

    /// @notice HayoHealth records that a patient was verified (card tap + face check) at a clinic.
    /// @param visitId     A unique ID for this visit, made off-chain (for example a hash of the check record).
    /// @param memberToken A hashed member ID. Never a name, card number or any readable patient data.
    /// @param provider    The clinic where the check happened. Must be registered.
    /// @param insurer     The patient's insurer. Must be registered.
    function recordVisit(bytes32 visitId, bytes32 memberToken, address provider, address insurer)
        external
        onlyRole(VERIFIER_ROLE)
        whenNotPaused
    {
        if (visitId == bytes32(0) || memberToken == bytes32(0)) revert ZeroValue();
        if (_visits[visitId].verifiedAt != 0) revert VisitAlreadyRecorded(visitId);
        if (!hasRole(PROVIDER_ROLE, provider)) revert NotAProvider(provider);
        if (!hasRole(INSURER_ROLE, insurer)) revert NotAnInsurer(insurer);

        _visits[visitId] = Visit({
            memberToken: memberToken,
            provider: provider,
            insurer: insurer,
            verifiedAt: uint64(block.timestamp),
            claimed: false
        });
        totalVisits++;

        emit VisitVerified(visitId, memberToken, provider, insurer);
    }

    /* ------------------------------------------------------------------ */
    /*                  Moment 2: clinic submits the bill                  */
    /* ------------------------------------------------------------------ */

    /// @notice A clinic submits a bill for a verified visit.
    /// @dev    Blocks three problems on-chain:
    ///         - no verified visit           -> card sharing / ghost patients
    ///         - same document hash twice    -> double billing
    ///         - one visit billed twice      -> double billing under a new document
    ///         Bills above the insurer's tariff are accepted but flagged straight away.
    /// @param claimHash     SHA-256 hash of the bill document (the document itself stays off-chain).
    /// @param visitId       The verified visit this bill is for.
    /// @param procedureCode Code of the procedure billed, e.g. keccak256("CONSULT-GP").
    /// @param amount        Amount billed in RWF.
    function submitClaim(bytes32 claimHash, bytes32 visitId, bytes32 procedureCode, uint256 amount)
        external
        onlyRole(PROVIDER_ROLE)
        whenNotPaused
    {
        if (claimHash == bytes32(0) || procedureCode == bytes32(0) || amount == 0) revert ZeroValue();
        if (_claims[claimHash].status != ClaimStatus.None) revert ClaimAlreadyExists(claimHash);

        Visit storage visit = _visits[visitId];
        if (visit.verifiedAt == 0) revert VisitNotFound(visitId);
        if (visit.provider != msg.sender) revert WrongProvider(visitId, msg.sender);
        if (visit.claimed) revert VisitAlreadyClaimed(visitId);

        // Effects first (checks-effects-interactions; there are no external calls anyway)
        visit.claimed = true;

        Claim storage claim = _claims[claimHash];
        claim.visitId = visitId;
        claim.procedureCode = procedureCode;
        claim.amount = amount;
        claim.provider = msg.sender;
        claim.insurer = visit.insurer;
        claim.status = ClaimStatus.Submitted;
        claim.submittedAt = uint64(block.timestamp);

        totalClaims++;
        _providerStats[msg.sender].submitted++;

        emit ClaimSubmitted(claimHash, visitId, msg.sender, procedureCode, amount);

        // Automatic tariff check: if the insurer set a price and the bill is above it, flag it.
        uint256 tariff = tariffOf[visit.insurer][procedureCode];
        if (tariff != 0 && amount > tariff) {
            _flag(claimHash, claim, FlagReason.TariffViolation, bytes32(0));
        }
    }

    /* ------------------------------------------------------------------ */
    /*               Moment 3: HayoHealth screening result                 */
    /* ------------------------------------------------------------------ */

    /// @notice HayoHealth found nothing wrong with the bill.
    function clearClaim(bytes32 claimHash) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        Claim storage claim = _existingClaim(claimHash);
        if (claim.status != ClaimStatus.Submitted) revert InvalidStatus(claimHash, claim.status);

        claim.status = ClaimStatus.Cleared;
        claim.screenedAt = uint64(block.timestamp);

        emit ClaimCleared(claimHash, msg.sender);
    }

    /// @notice HayoHealth flags the bill as an anomaly for the insurer to review.
    /// @param reason       Why it was flagged (cannot be None).
    /// @param evidenceHash Hash of the evidence kept off-chain, so it can be proven later.
    function flagClaim(bytes32 claimHash, FlagReason reason, bytes32 evidenceHash)
        external
        onlyRole(VERIFIER_ROLE)
        whenNotPaused
    {
        if (reason == FlagReason.None) revert InvalidFlagReason();
        Claim storage claim = _existingClaim(claimHash);
        if (claim.status != ClaimStatus.Submitted) revert InvalidStatus(claimHash, claim.status);

        _flag(claimHash, claim, reason, evidenceHash);
    }

    /* ------------------------------------------------------------------ */
    /*                 Moment 4: insurer's final decision                  */
    /* ------------------------------------------------------------------ */

    /// @notice The patient's insurer approves or rejects a screened bill. This is final.
    /// @dev    Only possible after screening (Cleared or Flagged). Only the visit's insurer can decide.
    function decideClaim(bytes32 claimHash, bool approve) external onlyRole(INSURER_ROLE) whenNotPaused {
        Claim storage claim = _existingClaim(claimHash);
        if (claim.insurer != msg.sender) revert WrongInsurer(claimHash, msg.sender);
        if (claim.status != ClaimStatus.Cleared && claim.status != ClaimStatus.Flagged) {
            revert InvalidStatus(claimHash, claim.status);
        }

        claim.status = approve ? ClaimStatus.Approved : ClaimStatus.Rejected;
        claim.decidedAt = uint64(block.timestamp);

        if (approve) {
            _providerStats[claim.provider].approved++;
        } else {
            _providerStats[claim.provider].rejected++;
        }

        emit ClaimDecided(claimHash, approve, msg.sender);
    }

    /* ------------------------------------------------------------------ */
    /*                     Read functions (free to call)                   */
    /* ------------------------------------------------------------------ */

    /// @notice Everything recorded about a bill. Anyone can call this.
    function getClaim(bytes32 claimHash) external view returns (Claim memory) {
        return _claims[claimHash];
    }

    /// @notice Everything recorded about a visit.
    function getVisit(bytes32 visitId) external view returns (Visit memory) {
        return _visits[visitId];
    }

    /// @notice A clinic's track record: bills submitted, flagged, approved and rejected.
    function getProviderStats(address provider)
        external
        view
        returns (uint32 submitted, uint32 flagged, uint32 approved, uint32 rejected)
    {
        ProviderStats memory s = _providerStats[provider];
        return (s.submitted, s.flagged, s.approved, s.rejected);
    }

    /// @notice Check a bill document: hash the file, pass the hash here.
    /// @return recorded True if this exact document was submitted.
    /// @return status   Where the claim is now (0 if never submitted).
    function verifyClaimDocument(bytes32 claimHash) external view returns (bool recorded, ClaimStatus status) {
        status = _claims[claimHash].status;
        recorded = status != ClaimStatus.None;
    }

    /* ------------------------------------------------------------------ */
    /*                           Internal helpers                          */
    /* ------------------------------------------------------------------ */

    /// @dev Loads a claim and reverts if it does not exist.
    function _existingClaim(bytes32 claimHash) private view returns (Claim storage claim) {
        claim = _claims[claimHash];
        if (claim.status == ClaimStatus.None) revert ClaimNotFound(claimHash);
    }

    /// @dev Shared logic for manual flags and the automatic tariff flag.
    function _flag(bytes32 claimHash, Claim storage claim, FlagReason reason, bytes32 evidenceHash) private {
        claim.status = ClaimStatus.Flagged;
        claim.flagReason = reason;
        claim.evidenceHash = evidenceHash;
        claim.screenedAt = uint64(block.timestamp);
        _providerStats[claim.provider].flagged++;

        emit ClaimFlagged(claimHash, reason, evidenceHash, msg.sender);
    }
}
