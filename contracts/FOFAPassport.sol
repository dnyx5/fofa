// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FOFAPassport
 * @notice On-chain DID registry and fan interaction logger for FOFA.
 *         Each user gets a decentralised identifier tied to their Ethereum address.
 *         Interactions (match attendance, merch purchases, social-media engagement)
 *         are recorded immutably so clubs and brands can verify fan loyalty.
 */
contract FOFAPassport {

    // ------------------------------------------------------------------ types
    enum InteractionType {
        MatchAttendance,   // 0
        MerchPurchase,     // 1
        SocialMedia        // 2
    }

    struct DIDRecord {
        string  did;           // e.g. "did:fofa:0xAbC..."
        string  displayName;
        string  favoriteClub;
        uint256 registeredAt;
        bool    exists;
    }

    struct Interaction {
        InteractionType iType;
        string          metadata;   // JSON blob — match id, product sku, tweet url, etc.
        uint256         timestamp;
        uint256         points;
    }

    // ------------------------------------------------------------------ state
    address public owner;

    mapping(address => DIDRecord)      public dids;
    mapping(address => Interaction[])  public interactions;
    mapping(address => uint256)        public totalPoints;

    address[] public registeredUsers;

    // ------------------------------------------------------------------ events
    event DIDRegistered(address indexed user, string did, uint256 timestamp);
    event InteractionLogged(
        address indexed user,
        InteractionType iType,
        string metadata,
        uint256 points,
        uint256 timestamp
    );

    // ------------------------------------------------------------------ modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyRegistered() {
        require(dids[msg.sender].exists, "DID not registered");
        _;
    }

    // ------------------------------------------------------------------ constructor
    constructor() {
        owner = msg.sender;
    }

    // ------------------------------------------------------------------ DID
    /**
     * @notice Register a new DID for the caller.
     */
    function registerDID(
        string calldata _did,
        string calldata _displayName,
        string calldata _favoriteClub
    ) external {
        require(!dids[msg.sender].exists, "DID already registered");

        dids[msg.sender] = DIDRecord({
            did:          _did,
            displayName:  _displayName,
            favoriteClub: _favoriteClub,
            registeredAt: block.timestamp,
            exists:       true
        });

        registeredUsers.push(msg.sender);

        emit DIDRegistered(msg.sender, _did, block.timestamp);
    }

    // ------------------------------------------------------------------ interactions
    /**
     * @notice Log a fan interaction on-chain.
     */
    function logInteraction(
        InteractionType _type,
        string calldata _metadata,
        uint256 _points
    ) external onlyRegistered {
        Interaction memory entry = Interaction({
            iType:     _type,
            metadata:  _metadata,
            timestamp: block.timestamp,
            points:    _points
        });

        interactions[msg.sender].push(entry);
        totalPoints[msg.sender] += _points;

        emit InteractionLogged(msg.sender, _type, _metadata, _points, block.timestamp);
    }

    // ------------------------------------------------------------------ views
    function getInteractionCount(address _user) external view returns (uint256) {
        return interactions[_user].length;
    }

    function getInteraction(address _user, uint256 _index)
        external view
        returns (InteractionType, string memory, uint256, uint256)
    {
        Interaction storage entry = interactions[_user][_index];
        return (entry.iType, entry.metadata, entry.timestamp, entry.points);
    }

    function getDID(address _user)
        external view
        returns (string memory, string memory, string memory, uint256)
    {
        DIDRecord storage r = dids[_user];
        require(r.exists, "DID not found");
        return (r.did, r.displayName, r.favoriteClub, r.registeredAt);
    }

    function getRegisteredUserCount() external view returns (uint256) {
        return registeredUsers.length;
    }
}
