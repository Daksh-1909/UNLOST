import Item from '../models/Item.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export async function findMatchesAndNotify(newItem) {
  try {
    const targetStatus = newItem.status === 'Lost' ? 'Found' : 'Lost';
    
    // 1. Find potential items in same category and opposite status
    const potentialMatches = await Item.find({
      status: targetStatus,
      category: newItem.category,
      _id: { $ne: newItem._id }
    });

    const newKeywords = new Set(
      `${newItem.title} ${newItem.description}`.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
    );

    const matches = [];

    for (let item of potentialMatches) {
      const itemKeywords = new Set(
        `${item.title} ${item.description}`.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      );

      let overlap = 0;
      for (let word of newKeywords) {
        if (word.length > 3 && itemKeywords.has(word)) {
          overlap++;
        }
      }

      // If at least 1 significant keyword overlaps, consider it a match
      if (overlap >= 1) {
        matches.push({ item, score: overlap });
      }
    }

    // Generate notifications for matched items
    for (let match of matches) {
      // Notify the owner of the existing item
      const existingUser = await User.findOne({ email: match.item.reporter_email });
      if (existingUser) {
        await new Notification({
          user_id: existingUser._id,
          user_email: existingUser.email,
          title: `Potential Match for "${match.item.title}"`,
          message: `🔍 A potential match for your ${targetStatus.toLowerCase()} item "${match.item.title}" was just reported!`,
          type: 'match',
          item_id: newItem._id,
          item_status: newItem.status,
          item_category: newItem.category,
          item_location: newItem.location,
          item_image: newItem.image_file,
          link: `/items`
        }).save();
      }

      // Notify the creator of the new item
      const newUser = await User.findOne({ email: newItem.reporter_email });
      if (newUser) {
        await new Notification({
          user_id: newUser._id,
          user_email: newUser.email,
          title: `Potential Match for "${newItem.title}"`,
          message: `🔍 A matching ${match.item.status.toLowerCase()} item "${match.item.title}" was found in our system.`,
          type: 'match',
          item_id: match.item._id,
          item_status: match.item.status,
          item_category: match.item.category,
          item_location: match.item.location,
          item_image: match.item.image_file,
          link: `/items`
        }).save();
      }
    }

    return matches;
  } catch (error) {
    console.error('Matching Error:', error);
    return [];
  }
}
