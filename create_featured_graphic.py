#!/usr/bin/env python3
"""
Create Google Play Featured Graphic for GabAi
Dimensions: 1024 x 500 pixels
Uses real GabAi icon, crisp text, proper spacing
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
import os
import math
import glob

def create_gradient_background(width, height, color1, color2):
    """Create a diagonal gradient background."""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = [int(255 * ((x + y) / (width + height))) for y in range(height) for x in range(width)]
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def create_phone_mockup_mini(screenshot_path, size=(120, 240)):
    """Create a mini phone mockup."""
    try:
        screenshot = Image.open(screenshot_path).convert("RGBA")
    except:
        screenshot = Image.new("RGBA", (1080, 2280), (255, 255, 255, 255))
    
    device_width, device_height = size
    bezel = 4
    corner_radius = 12
    screen_width = device_width - (bezel * 2)
    screen_height = device_height - 20
    
    screenshot_resized = screenshot.resize((screen_width, screen_height), Image.Resampling.LANCZOS)
    
    device = Image.new("RGBA", (device_width, device_height), (0, 0, 0, 0))
    device_draw = ImageDraw.Draw(device)
    device_draw.rounded_rectangle([0, 0, device_width - 1, device_height - 1], radius=corner_radius, fill=(35, 35, 35, 255))
    device.paste(screenshot_resized, (bezel, 10))
    
    return device

def get_fonts():
    """Get available fonts with good quality."""
    font_search = glob.glob("/nix/store/*/share/fonts/truetype/DejaVuSans-Bold.ttf")
    
    if font_search:
        fp = font_search[0]
        regular = fp.replace("-Bold", "")
        return {
            'title': ImageFont.truetype(fp, 52),
            'tagline': ImageFont.truetype(regular, 19),
            'subtitle': ImageFont.truetype(regular, 16),
            'feature': ImageFont.truetype(fp, 14),
            'cta': ImageFont.truetype(fp, 18),
        }
    
    default = ImageFont.load_default()
    return {'title': default, 'tagline': default, 'subtitle': default, 'feature': default, 'cta': default}

def load_gabai_icon(size=70):
    """Load and resize the real GabAi icon."""
    icon_paths = [
        "icon.png",
        "attached_assets/gabai-icon-optimized.png",
        "www/assets/gabai-icon-optimized-CmWdbmSQ.png",
    ]
    
    for path in icon_paths:
        if os.path.exists(path):
            icon = Image.open(path).convert("RGBA")
            icon = icon.resize((size, size), Image.Resampling.LANCZOS)
            return icon
    
    return None

def create_featured_graphic():
    """Create the main featured graphic."""
    width = 1024
    height = 500
    
    background = create_gradient_background(width, height, (59, 130, 246), (37, 99, 235))
    background = background.convert('RGBA')
    
    wave_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    wave_draw = ImageDraw.Draw(wave_layer)
    for wave_offset in range(4):
        points = [(x, height - 60 + wave_offset * 18 + int(18 * math.sin((x + wave_offset * 40) / 80))) for x in range(0, width + 10, 5)]
        points.extend([(width, height), (0, height)])
        wave_draw.polygon(points, fill=(255, 255, 255, 12 + wave_offset * 5))
    background = Image.alpha_composite(background, wave_layer)
    
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    screenshots = [
        "attached_assets/Screenshot_20251127_102527_GabAi_1764262020485.jpg",
        "attached_assets/Screenshot_20251127_103036_GabAi_1764262020468.jpg", 
        "attached_assets/Screenshot_20251127_103307_GabAi_1764262020435.jpg",
    ]
    phone_positions = [(680, 80, (130, 260), -10), (800, 30, (150, 300), 0), (905, 90, (120, 240), 12)]
    
    for i, (x, y, size, angle) in enumerate(phone_positions):
        if i < len(screenshots) and os.path.exists(screenshots[i]):
            phone = create_phone_mockup_mini(screenshots[i], size)
            if angle != 0:
                phone = phone.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
            overlay.paste(phone, (x, y), phone)
    
    background = Image.alpha_composite(background, overlay)
    draw = ImageDraw.Draw(background)
    fonts = get_fonts()
    
    icon_size = 72
    icon_x, icon_y = 50, 50
    gabai_icon = load_gabai_icon(icon_size)
    
    if gabai_icon:
        icon_bg = Image.new('RGBA', (icon_size + 8, icon_size + 8), (255, 255, 255, 255))
        icon_bg_draw = ImageDraw.Draw(icon_bg)
        icon_bg_draw.rounded_rectangle([0, 0, icon_size + 7, icon_size + 7], radius=16, fill=(255, 255, 255, 255))
        background.paste(icon_bg, (icon_x - 4, icon_y - 4), icon_bg)
        background.paste(gabai_icon, (icon_x, icon_y), gabai_icon)
        draw = ImageDraw.Draw(background)
    
    title_x = icon_x + icon_size + 20
    title_y = icon_y
    
    for offset in [(2, 2), (1, 1)]:
        draw.text((title_x + offset[0], title_y + offset[1]), "GabAi", font=fonts['title'], fill=(0, 0, 0, 60))
    draw.text((title_x, title_y), "GabAi", font=fonts['title'], fill=(255, 255, 255))
    
    tagline_y = title_y + 55
    draw.text((title_x, tagline_y), "Your AI Personal Assistant", font=fonts['tagline'], fill=(255, 255, 255))
    
    subtitle_y = tagline_y + 28
    draw.text((title_x, subtitle_y), "Perfect for Busy Moms & ADHD Minds", font=fonts['subtitle'], fill=(255, 255, 255, 220))
    
    features = [
        ("Voice Commands", 0, 0),
        ("Smart Lists", 1, 0),
        ("Group Reminders", 0, 1),
        ("Calendar Sync", 1, 1),
        ("OCR Contacts", 0, 2),
        ("Voice Chat", 1, 2),
    ]
    
    feature_start_x = 55
    feature_start_y = 215
    col_spacing = 175
    row_spacing = 38
    
    for feature_text, col, row in features:
        fx = feature_start_x + col * col_spacing
        fy = feature_start_y + row * row_spacing
        
        check_size = 16
        check_x = fx
        check_y = fy + 2
        
        draw.ellipse([check_x, check_y, check_x + check_size, check_y + check_size], fill=(255, 255, 255))
        
        cx = check_x + check_size // 2
        cy = check_y + check_size // 2
        draw.line([(cx - 4, cy), (cx - 1, cy + 4)], fill=(59, 130, 246), width=2)
        draw.line([(cx - 1, cy + 4), (cx + 5, cy - 3)], fill=(59, 130, 246), width=2)
        
        text_x = check_x + check_size + 10
        draw.text((text_x, fy), feature_text, font=fonts['feature'], fill=(255, 255, 255))
    
    cta_text = "Simplify Your Day"
    cta_y = 420
    cta_x = 55
    cta_bbox = draw.textbbox((0, 0), cta_text, font=fonts['cta'])
    cta_width = cta_bbox[2] - cta_bbox[0] + 40
    cta_height = 38
    
    draw.rounded_rectangle([cta_x, cta_y, cta_x + cta_width, cta_y + cta_height], radius=19, fill=(255, 255, 255))
    draw.text((cta_x + 20, cta_y + 8), cta_text, font=fonts['cta'], fill=(37, 99, 235))
    
    final = background.convert('RGB')
    
    enhancer = ImageEnhance.Sharpness(final)
    final = enhancer.enhance(1.1)
    
    final.save("mockups/featured_graphic.png", "PNG")
    final.save("mockups/featured_graphic.jpg", "JPEG", quality=95)
    
    print(f"Created: mockups/featured_graphic.png (1024x500)")
    print(f"Created: mockups/featured_graphic.jpg (1024x500)")
    return final

if __name__ == "__main__":
    os.makedirs("mockups", exist_ok=True)
    create_featured_graphic()
    print("\nFeatured graphic ready for Google Play!")
