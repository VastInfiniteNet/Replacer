// Imports
const {itemToString, InvSlots, Logger, loggingLevels: llog} = require("./utils.js")

// TODO: logging levels
const logger = new Logger(llog.info, "isBroke.js")

/**
 * Checks if a HeldItemChange event was triggered by an item breaking or ran out of item
 * @returns item that broken or false if nothing broke
 */
const isBroke = function(currentItem, oldItem, isOffHand) {
    const inv = Player.openInventory()

    const oldSlot = GlobalVars.getDouble("oldSlotIndex")
    const oldItemName = oldItem.getName().getString()
    
    var currentSlot = InvSlots.hotBar + inv.getSelectedHotbarSlotIndex()
    if (isOffHand) {
        logger.log("Item change in offhand", llog.info)
        
        currentSlot = InvSlots.offHand
    }
    const currentItemName = currentItem.getName().getString()
    
    GlobalVars.putDouble("oldSlotIndex", currentSlot)

    logger.log(`Old item: ${itemToString(oldItem)}`, llog.debug)
    logger.log(`New item: ${itemToString(currentItem)}`, llog.debug)

    // check still in same slot
    if (currentSlot !== oldSlot) {
        logger.log(`Different slots!: old: ${oldSlot}, current: ${currentSlot}`, llog.debug)
        return false    
    }

    // check if 1 left
    if (oldItem.getCount() !== 1) {
        logger.log("Not empty!", llog.debug)
        return false
    }

    // check that old item has changed
    if (oldItemName === "Air" || currentItemName === oldItemName) {
        logger.log("Didn't run out!", llog.debug)
        return false
    }

    // check old item was at break durability (1)
    if (oldItem.getMaxDamage() > 0 && oldItem.getMaxDamage() - oldItem.getDamage() !== 1) {
        logger.log("Item still has durability!", llog.debug)
        return false
    }

    // check if equivalent item is in inventory
    if (false) {
        logger.log("Item was just moved in inventory!", llog.debug)
        return false
    }

    // item broken probably or just dropped lol
    logger.log("Current item ran out!", llog.info)
    return oldItem
}

module.exports = {
    isBroke: isBroke,
}