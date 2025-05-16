-- State variables
local currentState = {
    temperature = 50,
    pressure = 50,
    timeLeft = 90,
    isActive = false
}

-- Local variables
local failureCount = 0
local cooldownUntil = 0

local lastPoliceAlert = 0
local labProps = {}

local isInLab = false
local isFailureTriggered = false
local isFailureProcessed = false
local pendingEffectType = nil    -- Tracks scheduled effect type when UI is closed
local pendingEffectTime = 0      -- When the effect should trigger

local startTime = 0              -- Used to track actual time for cooking

-- Cached natives
local PlayerPedId = PlayerPedId
local GetEntityCoords = GetEntityCoords
local SetEntityCoords = SetEntityCoords
local GetGameTimer = GetGameTimer
local GetEntityHealth = GetEntityHealth
local SetEntityHealth = SetEntityHealth
local vector3 = vector3

-- Helper functions
local function LoadAnimDict(dict)
    if not HasAnimDictLoaded(dict) then
        RequestAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            Wait(10)
        end
    end
end

local function LoadPtfxAsset(asset)
    if not HasNamedPtfxAssetLoaded(asset) then
        RequestNamedPtfxAsset(asset)
        while not HasNamedPtfxAssetLoaded(asset) do
            Wait(10)
        end
    end
end

local function LoadModel(model)
    local hash = GetHashKey(model)
    if not HasModelLoaded(hash) then
        RequestModel(hash)
        while not HasModelLoaded(hash) do
            Wait(10)
        end
    end
    return hash
end




-- Skip cooldown in debug mode
local function CanAttemptLab()
    if Config.Constants.DEBUG then return true end
    return GetGameTimer() >= cooldownUntil
end




local function SetCooldown()
    if Config.Constants.DEBUG then return end
    local cooldownMs = Config.Cooldown * 60 * 1000
    cooldownUntil = GetGameTimer() + cooldownMs
    SetResourceKvp("druglab_cooldown", tostring(cooldownUntil))
end

local function ShowCooldownNotification()
    local currentTime = GetGameTimer()
    if cooldownUntil > currentTime then
        local remainingMinutes = math.ceil((cooldownUntil - currentTime) / 60000)
        BeginTextCommandDisplayHelp("STRING")
        AddTextComponentSubstringPlayerName("You must wait " .. remainingMinutes .. " minutes before attempting again.")
        EndTextCommandDisplayHelp(0, false, true, 3000)
    end
end

-- Lab functions
function EnterLab()
    if not CanAttemptLab() then 
        ShowCooldownNotification()
        return 
    end
    local ped = PlayerPedId()
    local coords = Config.LabInterior.coords
    SetEntityCoords(ped, coords.x, coords.y, coords.z, false, false, false, false)
    SetEntityHeading(ped, Config.LabInterior.heading)
    isInLab = true
end

function ExitLab()
    local ped = PlayerPedId()
    local coords = Config.LabLocation
    SetEntityCoords(ped, coords.x, coords.y, coords.z, false, false, false, false)
    isInLab = false
end

-- Start the drug cooking minigame
function StartCooking()
    if not CanAttemptLab() then 
        ShowCooldownNotification()
        return 
    end
    isFailureTriggered = false
    isFailureProcessed = false
    currentState.isActive = true
    startTime = GetGameTimer()
    pendingEffectType = nil
    pendingEffectTime = 0
    
    SendNUIMessage({
        type = 'startMinigame',
        duration = Config.Minigame.Duration,
        safeZones = Config.Minigame.SafeZones,
        currentState = currentState
    })
    SetNuiFocus(true, true)
end

-- Failure: high pressure causes explosion
function TriggerExplosion()
    if Config.Constants.DEBUG then
        print('[DEBUG] Explosion triggered - Health damage: ' .. Config.Constants.EXPLOSION_DAMAGE)
    else
        print('Explosion triggered')
    end
    
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    
    AddExplosion(coords.x, coords.y, coords.z, 7, 100.0, true, false, 1.0)
    SetPedToRagdoll(ped, 5000, 5000, 0, 0, 0, 0)
    
    local currentHealth = GetEntityHealth(ped)
    SetEntityHealth(ped, math.max(1, currentHealth - Config.Constants.EXPLOSION_DAMAGE))
    ShakeGameplayCam("MEDIUM_EXPLOSION_SHAKE", 1.0)
    
    LoadPtfxAsset("core")
    UseParticleFxAssetNextCall("core")
    StartParticleFxNonLoopedAtCoord("exp_grd_flare", coords.x, coords.y, coords.z, 0.0, 0.0, 0.0, 2.0, false, false, false)
end

-- Failure: low temperature causes toxic leak
function TriggerToxicLeak()
    if Config.Constants.DEBUG then
        print('[DEBUG] Toxic leak triggered')
    else
        print('Toxic leak triggered')
    end
    
    local ped = PlayerPedId()
    local tableLocation = vector3(
        Config.LabInterior.coords.x + Config.LabProps[1].offset.x,
        Config.LabInterior.coords.y + Config.LabProps[1].offset.y,
        Config.LabInterior.coords.z + Config.LabProps[1].offset.z
    )

    ExecuteCommand("e cough")
    AnimpostfxPlay("DrugsMichaelAliensFightIn", 5000, false)

    LoadPtfxAsset("core")
    UseParticleFxAssetNextCall("core")
    StartParticleFxNonLoopedAtCoord("exp_grd_flare", tableLocation.x, tableLocation.y, tableLocation.z, 0.0, 0.0, 0.0, 1.0, false, false, false)

    -- Apply damage over time (5 cycles)
    local function applyDamage(count)
        if count <= 0 then
            ClearPedTasks(ped)
            AnimpostfxStop("DrugsMichaelAliensFightIn")
            return
        end
        ExecuteCommand("e cough")
        local currentHealth = GetEntityHealth(ped)
        SetEntityHealth(ped, math.max(1, currentHealth - 10))
        SetTimeout(3000, function() applyDamage(count - 1) end)
    end
    applyDamage(5)
end

-- Alert police after too many failures
function TriggerPoliceAlert()
    local currentTime = GetGameTimer()
    if currentTime - lastPoliceAlert < Config.Constants.POLICE_ALERT_COOLDOWN then return end
    
    local coords = GetEntityCoords(PlayerPedId())
    TriggerServerEvent('dispatch:policeAlert', coords)
    lastPoliceAlert = currentTime
end

-- NUI Callbacks
RegisterNUICallback('uiReady', function(_, cb) cb('ok') end)

-- Handle manual UI closing
RegisterNUICallback('closeUI', function(data, cb)
    if data then
        for k, v in pairs(data) do
            if currentState[k] ~= nil then
                currentState[k] = v
            end
        end
    end
    
    currentState.isActive = false
    SetNuiFocus(false, false)
    
    -- Still trigger pending effects if UI was manually closed
    if pendingEffectType and GetGameTimer() < pendingEffectTime then
        local remainingTime = pendingEffectTime - GetGameTimer()
        if remainingTime > 0 then
            SetTimeout(remainingTime, function()
                if pendingEffectType == "explosion" then
                    TriggerExplosion()
                elseif pendingEffectType == "toxic" then
                    TriggerToxicLeak()
                end
                pendingEffectType = nil
                pendingEffectTime = 0
            end)
        else
            if pendingEffectType == "explosion" then
                TriggerExplosion()
            elseif pendingEffectType == "toxic" then
                TriggerToxicLeak()
            end
            pendingEffectType = nil
            pendingEffectTime = 0
        end
    end
    
    cb('ok')
end)

-- Handle minigame completion or failure
RegisterNUICallback('minigameComplete', function(data, cb)
    if isFailureTriggered and not (data and data.emergency) then
        cb('ok')
        return
    end

    if Config.Constants.DEBUG and data then
        print("[DEBUG] Minigame completed - Success: " .. tostring(data.success))
        print("[DEBUG] Temperature: " .. tostring(data.temperature) .. ", Pressure: " .. tostring(data.pressure))
    end

    if data then
        for k, v in pairs(data) do
            if currentState[k] ~= nil then
                currentState[k] = v
            end
        end
    end
    
    -- Prevent timer reset on reopen
    if startTime > 0 and data and data.timeLeft then
        local elapsedTime = (GetGameTimer() - startTime) / 1000
        local calculatedTimeLeft = math.max(0, Config.Minigame.Duration - elapsedTime)
        if calculatedTimeLeft < data.timeLeft then
            currentState.timeLeft = calculatedTimeLeft
        else
            currentState.timeLeft = data.timeLeft
        end
    end
    
    local pressure = tonumber(data and data.pressure) or currentState.pressure
    local temperature = tonumber(data and data.temperature) or currentState.temperature
    
    if data and data.success then
        SetNuiFocus(false, false)
        currentState.isActive = false
        
        print('Reward given: ' .. Config.Reward.Item .. ' x' .. Config.Reward.Amount)
        failureCount = 0
        isFailureProcessed = false
        pendingEffectType = nil
        pendingEffectTime = 0
    else
        if not isFailureProcessed then
            failureCount = failureCount + 1
            isFailureProcessed = true
            
            if data and data.emergency then
                SetNuiFocus(false, false)
                currentState.isActive = false
                pendingEffectType = nil
                pendingEffectTime = 0
            elseif pressure >= Config.Minigame.CriticalLevels.Pressure then
                -- Pressure too high - explosion in 1 sec
                isFailureTriggered = true
                pendingEffectType = "explosion"
                pendingEffectTime = GetGameTimer() + 1000
                
                SetTimeout(1000, function()
                    if currentState.isActive then
                        SetNuiFocus(false, false)
                        currentState.isActive = false
                        TriggerExplosion()
                        pendingEffectType = nil
                        pendingEffectTime = 0
                    end
                end)
            elseif temperature <= Config.Minigame.CriticalLevels.Temperature then
                -- Temperature too low - toxic leak in 1 sec
                isFailureTriggered = true
                pendingEffectType = "toxic"
                pendingEffectTime = GetGameTimer() + 1000
                
                SetTimeout(1000, function()
                    if currentState.isActive then
                        SetNuiFocus(false, false)
                        currentState.isActive = false
                        TriggerToxicLeak()
                        pendingEffectType = nil
                        pendingEffectTime = 0
                    end
                end)
            else
                SetNuiFocus(false, false)
                currentState.isActive = false
                pendingEffectType = nil
                pendingEffectTime = 0
            end
            
            if failureCount >= Config.PoliceAlertThreshold then
                TriggerPoliceAlert()
            end
        end
    end
    
    SetCooldown()
    cb('ok')
end)

-- Initialization
Citizen.CreateThread(function()
    -- Load saved cooldown
    local stored = GetResourceKvpString("druglab_cooldown")
    if stored then
        local storedTime = tonumber(stored)
        if storedTime and storedTime > GetGameTimer() then
            cooldownUntil = storedTime
        end
    end

    -- Add entry point to lab
    exports.ox_target:addBoxZone({
        coords = Config.LabLocation,
        size = vector3(2, 2, 2),
        rotation = 0,
        options = {
            {
                name = 'enter_lab',
                icon = 'fas fa-door-open',
                label = 'Enter Lab',
                onSelect = EnterLab
            }
        }
    })

    RequestIpl(Config.LabInterior.ipl)
    
    -- Add exit point from lab
    exports.ox_target:addBoxZone({
        coords = Config.LabInterior.coords,
        size = vector3(2, 2, 2),
        rotation = 0,
        options = {
            {
                name = 'exit_lab',
                icon = 'fas fa-door-closed',
                label = 'Exit Lab',
                onSelect = ExitLab
            }
        }
    })
    
    -- Spawn lab equipment
    for _, prop in ipairs(Config.LabProps) do
        local hash = LoadModel(prop.model)
        local labCoords = Config.LabInterior.coords
        local obj = CreateObject(
            hash, 
            labCoords.x + prop.offset.x,
            labCoords.y + prop.offset.y,
            labCoords.z + prop.offset.z,
            false, false, false
        )
        
        FreezeEntityPosition(obj, true)
        table.insert(labProps, obj)

        exports.ox_target:addLocalEntity(obj, {
            {
                name = 'start_cooking_' .. prop.model,
                icon = 'fas fa-flask',
                label = 'Start Cooking',
                onSelect = StartCooking
            }
        })
    end
end)

AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        print('Drug lab resource started')
    end
end)

-- Clean up on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        SetNuiFocus(false, false)
        for _, prop in ipairs(labProps) do
            DeleteObject(prop)
        end
    end
end)
