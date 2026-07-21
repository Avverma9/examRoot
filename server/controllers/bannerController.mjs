import Banner from "../models/Banner.mjs";

// Get active banners for mobile (sorted by displayOrder)
export const getActiveBanners = async (req, res) => {
  try {
    console.log('🔍 Fetching active banners...');
    
    // Simplified query - just get active banners
    const banners = await Banner.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    console.log('✅ Found', banners.length, 'active banners');

    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error('❌ Banner fetch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all banners (admin)
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create banner (admin)
export const createBanner = async (req, res) => {
  try {
    const { title, description, imageUrl, actionType, actionValue, displayOrder, startDate, endDate } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and Image URL are required" 
      });
    }

    const banner = await Banner.create({
      title,
      description: description || "",
      imageUrl,
      actionType: actionType || "none",
      actionValue: actionValue || "",
      displayOrder: displayOrder || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: true
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update banner (admin)
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, actionType, actionValue, displayOrder, isActive, startDate, endDate } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      id,
      {
        title,
        description,
        imageUrl,
        actionType,
        actionValue,
        displayOrder,
        isActive,
        startDate,
        endDate
      },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete banner (admin)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reorder banners (admin)
export const reorderBanners = async (req, res) => {
  try {
    const { banners } = req.body;

    if (!Array.isArray(banners)) {
      return res.status(400).json({ success: false, message: "Banners must be an array" });
    }

    const updatePromises = banners.map((item, index) =>
      Banner.findByIdAndUpdate(item._id, { displayOrder: index })
    );

    await Promise.all(updatePromises);

    res.status(200).json({ success: true, message: "Banners reordered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
