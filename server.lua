

-- Handle reward giving
RegisterNetEvent('druglab:giveReward')

AddEventHandler('druglab:giveReward', function(item, amount)


    local source = source
    -- You can implement your own inventory system here
    if Config.Constants.DEBUG then
        print('[Drug Lab] Player ' .. GetPlayerName(source) .. ' received ' .. amount .. 'x ' .. item)
    end
end)




-- Handle police alerts - 


RegisterNetEvent('dispatch:policeAlert')

AddEventHandler('dispatch:policeAlert', function(coords)
    if Config.Constants.DEBUG then

        print('[Drug Lab] Alert triggered at coords: ' .. coords.x .. ', ' .. coords.y .. ', ' .. coords.z)

    end
    -- server-side dispatch system
end)

-- Helper function to check if player is police
function IsPlayerPolice(playerId)
    -- Implement your own police check logic here
    local player = GetPlayerPed(playerId)
    -- example 
    -- local job = ESX.GetPlayerData().job.name -- Assuming you are using ESX
    return false 
end 