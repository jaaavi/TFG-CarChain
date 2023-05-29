// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract CarChain {

    bytes32 private contract_owner;

    struct reparationInfo {
        bytes32 security_hash;
        uint km;
        uint date;
        string description;
        string revision_type;
    }

    struct vehicleInfo {
        mapping(bytes32 => reparationInfo) reparations;
        vehicleData data;
    }

    struct vehicleData {
        bytes32[] reparations_ids;
        bytes32[] owners;
        uint[] km_history; //Accedemos al último para saber cuales son los actuales
        uint matriculation_date;
        bool active;
        string visibility;
    }

    struct workshopInfo {
        bytes32[] vehicles_ids;
        mapping(bytes32 => reparationInfo) reparations;
    }

    mapping(bytes32 => vehicleInfo) private vehicles;
    mapping(bytes32 => workshopInfo) private workshops;
    mapping(bytes32 => bool) private authorized_workshops;

    //user_hash => (vehicle_has => active)
    mapping(bytes32 => mapping(bytes32 => bool)) private  ownerXvehicles;
    
    modifier isContractOwner(bytes32 user_hash) {
        require(contract_owner == user_hash, "Acces denied, only able for contract owner");
        _;
    }

    modifier isWorkshopAdded(bytes32 workshop_hash) {
        require(!authorized_workshops[workshop_hash]);
        _;
    }

    modifier vehicleActive(bytes32 vehicle_hash) {
        require(vehicles[vehicle_hash].data.active); //Se comrpueba que el vehículo al que se accede está activo
        _;
    }

    modifier ownerVehiclesEmpty(bytes32 user_hash, bytes32 vehicle_hash) {
        require(ownerXvehicles[user_hash][vehicle_hash] == false); //Se que el usuario no tiene vehículos
        _;
    }

    modifier isVehicleOwner(bytes32 user_hash, bytes32 vehicle_hash) {
        require(vehicles[vehicle_hash].data.owners[vehicles[vehicle_hash].data.owners.length - 1] == user_hash);
        _;
    }

    modifier isVehicleInOwnersMap(bytes32 user_hash, bytes32 vehicle_hash) {
        require(ownerXvehicles[user_hash][vehicle_hash] == true);
        _;
    }
    


    //Reparation
    function registerVehicleReparation(bytes32 vehicle_hash, bytes32 reparation_hash, bytes32 security_hash, uint km, uint date, string memory description, string memory revision_type) public returns (bool) {
        // Verificar que el vehículo no esté ya registrado

        vehicleInfo storage vehicle = vehicles[vehicle_hash];

        //Solo en el caso de que los km que añade el taller son mayores que los últimos km añadidos entonces se puede realizar la reparación
        if (vehicle.data.km_history[vehicle.data.km_history.length -1] < km){
            vehicles[vehicle_hash].data.reparations_ids.push(reparation_hash);
            reparationInfo storage vehicleReparation = vehicle.reparations[reparation_hash];
            vehicleReparation.security_hash = security_hash;
            vehicleReparation.date = date;
            vehicleReparation.km = km;
            vehicleReparation.description = description;
            vehicleReparation.revision_type = revision_type;
            vehicle.data.km_history.push(km);
            vehicle.data.active = true;
            return true;
        }else{
            return false;
        }

       

    }

    function registerVehicle(bytes32 vehicle_hash,uint km, bytes32 owner_hash, uint matriculation_date) public returns (vehicleData memory) {
        // Verificar que el vehículo no esté ya registrado
        require(vehicles[vehicle_hash].data.active == false);

        ownerXvehicles[owner_hash][vehicle_hash] = true;
        vehicles[vehicle_hash].data.owners.push(owner_hash);
        vehicles[vehicle_hash].data.km_history.push(km);
        vehicles[vehicle_hash].data.matriculation_date = matriculation_date;
        vehicles[vehicle_hash].data.visibility = 'private';
        vehicles[vehicle_hash].data.active = true;
        return vehicles[vehicle_hash].data;
    }

    function getVehicleReparation(bytes32 vehicle_hash, bytes32 reparation_hash) public vehicleActive(vehicle_hash) view returns (reparationInfo memory) {
        reparationInfo storage reparation = vehicles[vehicle_hash].reparations[reparation_hash];
        return reparation;
    }

    //Vehicle
    function getVehicle(bytes32 vehicle_hash) public view returns (vehicleData memory){
        vehicleData storage vehicle = vehicles[vehicle_hash].data;
        return vehicle;

    }

    function getVehicleCurrentOwner(bytes32 vehicle_hash) public vehicleActive(vehicle_hash) view returns (bytes32) {
        return vehicles[vehicle_hash].data.owners[vehicles[vehicle_hash].data.owners.length - 1];
    }

    function addVehicleOwner(bytes32 user_hash,bytes32 vehicle_hash) public vehicleActive(vehicle_hash) ownerVehiclesEmpty(user_hash, vehicle_hash) returns (bool){
        ownerXvehicles[user_hash][vehicle_hash] = true;
        return ownerXvehicles[user_hash][vehicle_hash]; //Devuelve true si lo que acaba de insertar es lo que le viene por parámetros
    }

    function setVisibility(bytes32 user_hash,bytes32 vehicle_hash, string memory visibility) public isVehicleInOwnersMap(user_hash, vehicle_hash) isVehicleOwner(user_hash, vehicle_hash) returns (string memory){
        vehicleData storage vehicle = vehicles[vehicle_hash].data;
        vehicle.visibility = visibility;
        
        return visibility;
    }
    
    //Workshops
    function authorizeWorkshop(bytes32 user_hash,bytes32 new_workshop_hash) public isWorkshopAdded(new_workshop_hash) isContractOwner(user_hash) returns (bool){
        authorized_workshops[new_workshop_hash] = true;
        workshops[new_workshop_hash];
        return true;
    }
    

    //contract owner
    function addressOwner() public view returns (bytes32){
        return contract_owner;
    }

}