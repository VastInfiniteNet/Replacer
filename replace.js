/**
 * Automatically replaces a held tool that breaks, or a held item that runs out with a compatible replacement.  
 * 
 * @author MotokoKusanagi#5346
 * @contact MotokoKusanagi#5346 discord
 * @contact screwthisusernameprocess@gmail.com
 */

const inv = Player.openInventory()
const BLACK_LIST = ["sword", "potion"]

const ENCHANT_MODES = Object.freeze({
    /**
     * Don't consider enchants when looking for replacement.
     */
    OFF: Symbol('off'),

    /**
     * Match certain enchants when looking for replacement.
     * Look at `SPECIAL_ENCHANTS` below for enchants considered special.
     */
    SPECIAL: Symbol('special'),

    /**
     * Match enchants exactly when looking for replacement.
     */
    STRICT: Symbol('strict')
 })

 const SPECIAL_ENCHANTS = Object.freeze({
    SILK_TOUCH: 'Silk Touch',
    FORTUNE: 'Fortune'
 })

const INV_SLOTS = Object.freeze({
    MAIN_SLOTS: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    HOTBAR_SLOTS: [36, 37, 38, 39, 40, 41, 42, 43, 44],
    OFFHAND_SLOT: 45,
})

 // ----- CONFIG -----
const ENCHANT_MODE = ENCHANT_MODES.OFF

// ----- END OF CONFIG -----

function itemId(itemStackHelper) {
    return itemStackHelper.getItemId()
}

function itemName(itemStackHelper) {
    return itemStackHelper.getName().getString()
}

function itemToString(item) {
    return `${item.getName().getString()} (${item.getCount()}) dura: (${item.getMaxDamage() - item.getDamage()}/${item.getMaxDamage()})`
}


/**
 * Finds the slot of item in inventory that is a suitable replacement.
 * @param {ItemStackHelper} toReplace item to replace.
 * @returns {Number} slot number of replacement, null if no replacement.
 */
function findReplacementSlot(toReplace) {
    for (let k of [...INV_SLOTS.MAIN_SLOTS, ...INV_SLOTS.HOTBAR_SLOTS]) {
        if (itemId(inv.getSlot(k)) === itemId(toReplace) && validEnchant(inv.getSlot(k), toReplace)) {
            Chat.log(`Found replacement in slot ${k}: ${itemName(inv.getSlot(k))} === ${itemName(toReplace)}`)
            return k
        }
    }
    return null
}

function isSimilarItemInInventory(itemStackHelper) {

}

/**
 * Checks if replacement item has equivalent enchants, given the enchant mode.
 * @param {ItemStackHelper} item item being replaced
 * @param {ItemStackHelper} candidate possible replacement
 * @returns whether or not candidate has equivalent enchants
 */
function validEnchant(item, candidate) {
    if (!item.getNBT()) // items dont have NBT data!
        return true

    switch (ENCHANT_MODE) {
        case ENCHANT_MODES.STRICT:
            return  item.getNBT().get("Enchantments").asString() === 
                    candidate.getNBT().get("Enchantments").asString()
        case ENCHANT_MODES.SPECIAL:
            // TODO: check if candidate possesses same special enchant as item.
            return true
        case ENCHANT_MODES.OFF:
        default:
            return true
    }
}

/**
 * Decides if held item change was from item break/runnout or not.
 * @param {ItemStackHelper} currentItem current ItemStackHelper held 
 * @param {ItemStackHelper} oldItem     old ItemStackHelper held 
 * @param {Boolean} isOffHand if item change happened in off hand
 * @returns {Boolean} whether or not an item broke/ranout
 */
function isBroke(currentItem, oldItem, isOffHand) {
    const inv = Player.openInventory()

    const oldSlot = GlobalVars.getDouble("oldSlotIndex")
    const oldItemName = itemName(oldItem)
    
    var currentSlot = INV_SLOTS.HOTBAR_SLOTS[0] + inv.getSelectedHotbarSlotIndex()
    if (isOffHand) {
        Chat.log("Item change in offhand")
        
        currentSlot = INV_SLOTS.OFFHAND_SLOT
    } 
    const currentItemName = itemName(currentItem)
    
    GlobalVars.putDouble("oldSlotIndex", currentSlot)


    Chat.log(`Old     item: ${itemToString(oldItem)}`)
    Chat.log(`Current item: ${itemToString(currentItem)}`)

    // check if 1 left
    if (currentItem.getCount() > 0) {
        Chat.log(`Not empty! ${currentItem.getCount()} left!`)
        return false
    }

    // check if inventory open
    if (Hud.getOpenScreenName() !== null) {
        Chat.log(`Inventory ${Hud.getOpenScreenName()} is open!`)
        return false
    }

    // check still in same slot
    if (currentSlot !== oldSlot && currentSlot != INV_SLOTS.OFFHAND_SLOT) {
        Chat.log(`Different slots!: old: ${oldSlot}, current: ${currentSlot}`)
        return false    
    }

    // check that old item ran out
    if (oldItemName === "Air" || currentItemName === oldItemName) {
        Chat.log("Didn't run out!")
        return false
    }

    // check if non-blacklisted item
    if ( BLACK_LIST.some(e => itemId(oldItem).includes(e)) ) {
        Chat.log(`Unreplacable item (${itemId(oldItem)})!`)
        return false
    }

    // item broken probably or just dropped lol
    Chat.log("Current item ran out!")
    return true
}

/**
 * Replaces any item that runs out if there is a replacement.
 * @param {ItemStackHelper} oldI old item
 * @param {ItemStackHelper} newI new item
 * @param {Boolean} offHand if change happened in off hand
 * @return {Boolean} whether or not a replacement happened
 */
function replace(oldI, newI, offHand) {
    if (!isBroke(newI, oldI, offHand)) { // no replacing needed!
        return false
    }

    const replacementSlot = findReplacementSlot(oldI)
    if (!replacementSlot) { // no replacement found
        Chat.log("No replacement found!")
        return false
    }

    var currentSlot = INV_SLOTS.HOTBAR_SLOTS[0] + inv.getSelectedHotbarSlotIndex()
    if (offHand) {
        Chat.log("Change happened in offhand.")
        currentSlot = INV_SLOTS.OFFHAND_SLOT
    }

    let waitAmount = 3;
    Client.waitTick(waitAmount)
    inv.swap(currentSlot, replacementSlot)
    World.playSound("entity.player.levelup", 0.3, 1)
    Client.waitTick(waitAmount)
    return true
}

replace(event.oldItem, event.item, event.offHand)