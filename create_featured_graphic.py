#!/usr/bin/env python3
"""
Create Google Play Featured Graphic for GabAi
Dimensions: 1024 x 500 pixels
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os
import math

def create_gradient_background(width, height, color1, color2):
    """Create a diagonal gradient background."""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    
    for y in range(height):
        for x in range(width):
            mask_data.append(int(255 * ((x + y) / (width + height))))
    
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
    device_draw.rounded_rectangle([0, 0, device_width - 1, device_height - 1], radius=corner_radius, fill=(40, 40, 40, 255))
    device.paste(screenshot_resized, (bezel, 10))
    
    return device

def get_fonts():
    """Get available fonts."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/nix/store/57xv61c5zi8pphjbcwxxjlgc34p61ic9-dejavu-fonts-2.37/share/fonts/truetype/DejaVuSans-Bold.ttf",
    ]
    
    for fp in font_paths:
        if os.path.exists(fp):
            return {
                'title': ImageFont.truetype(fp, 54),
                'tagline': ImageFont.truetype(fp.replace("-Bold", ""), 20),
                'small': ImageFont.truetype(fp.replace("-Bold", ""), 16),
                'feature': ImageFont.truetype(fp.replace("-Bold", ""), 15),
            }
    
    import glob
    dejavu_files = glob.glob("/nix/store/*/share/fonts/truetype/DejaVuSans-Bold.ttf")
    if dejavu_files:
        fp = dejavu_files[0]
        return {
            'title': ImageFont.truetype(fp, 54),
            'tagline': ImageFont.truetype(fp.replace("-Bold", ""), 20),
            'small': ImageFont.truetype(fp.replace("-Bold", ""), 16),
            'feature': ImageFont.truetype(fp.replace("-Bold", ""), 15),
        }
    
    default = ImageFont.load_default()
    return {'title': default, 'tagline': default, 'small': default, 'feature': default}

def create_featured_graphic():
    """Create the main featured graphic."""
    width = 1024
    height = 500
    
    background = create_gradient_background(width, height, (59, 130, 246), (30, 64, 175))
    background = background.convert('RGBA')
    draw = ImageDraw.Draw(background)
    
    wave_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    wave_draw = ImageDraw.Draw(wave_layer)
    for wave_offset in range(4):
        points = [(x, height - 70 + wave_offset * 22 + int(20 * math.sin((x + wave_offset * 50) / 90))) for x in range(0, width + 10, 5)]
        points.extend([(width, height), (0, height)])
        wave_draw.polygon(points, fill=(255, 255, 255, 15 + wave_offset * 6))
    background = Image.alpha_composite(background, wave_layer)
    
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    screenshots = [
        "attached_assets/Screenshot_20251127_102527_GabAi_1764262020485.jpg",
        "attached_assets/Screenshot_20251127_103036_GabAi_1764262020468.jpg",
        "attached_assets/Screenshot_20251127_103307_GabAi_1764262020435.jpg",
    ]
    phone_positions = [(700, 90, (125, 250), -8), (810, 40, (145, 290), 0), (910, 100, (115, 230), 10)]
    
    for i, (x, y, size, angle) in enumerate(phone_positions):
        if i < len(screenshots) and os.path.exists(screenshots[i]):
            phone = create_phone_mockup_mini(screenshots[i], size)
            if angle != 0:
                phone = phone.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
            overlay.paste(phone, (x, y), phone)
    
    background = Image.alpha_composite(background, overlay)
    draw = ImageDraw.Draw(background)
    fonts = get_fonts()
    
    logo_size = 65
    logo_x, logo_y = 50, 55
    draw.rounded_rectangle([logo_x, logo_y, logo_x + logo_size, logo_y + logo_size], radius=14, fill=(255, 255, 255))
    cx, cy = logo_x + logo_size // 2, logo_y + logo_size // 2
    draw.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=(59, 130, 246))
    draw.line([(cx - 9, cy), (cx - 2, cy + 8)], fill=(255, 255, 255), width=4)
    draw.line([(cx - 2, cy + 8), (cx + 11, cy - 6)], fill=(255, 255, 255), width=4)
    
    title_x = logo_x + logo_size + 18
    draw.text((title_x + 2, logo_y + 7), "GabAi", font=fonts['title'], fill=(0, 0, 0, 80))
    draw.text((title_x, logo_y + 5), "GabAi", font=fonts['title'], fill=(255, 255, 255))
    
    draw.text((title_x, logo_y + 60), "Your AI Personal Assistant", font=fonts['tagline'], fill=(255, 255, 255, 240))
    draw.text((title_x, logo_y + 85), "Perfect for Busy Moms & ADHD Minds", font=fonts['small'], fill=(255, 255, 255, 200))
    
    features = ["Voice Commands", "Smart Lists", "Group Reminders", "Calendar Sync"]
    feature_y = 210
    feature_x = 55
    spacing_x = 155
    spacing_y = 42
    
    for i, feature in enumerate(features):
        row, col = i // 2, i % 2
        fx = feature_x + col * spacing_x
        fy = feature_y + row * spacing_y
        
        draw.ellipse([fx, fy + 2, fx + 18, fy + 20], fill=(255, 255, 255, 230))
        draw.line([(fx + 5, fy + 11), (fx + 8, fy + 15)], fill=(59, 130, 246), width=2)
        draw.line([(fx + 8, fy + 15), (fx + 13, fy + 7)], fill=(59, 130, 246), width=2)
        draw.text((fx + 24, fy + 2), feature, font=fonts['feature'], fill=(255, 255, 255, 240))
    
    more_features = ["OCR Contacts", "Voice Chat"]
    for i, feature in enumerate(more_features):
        fx = feature_x + i * spacing_x
        fy = feature_y + 2 * spacing_y
        draw.ellipse([fx, fy + 2, fx + 18, fy + 20], fill=(255, 255, 255, 230))
        draw.line([(fx + 5, fy + 11), (fx + 8, fy + 15)], fill=(59, 130, 246), width=2)
        draw.line([(fx + 8, fy + 15), (fx + 13, fy + 7)], fill=(59, 130, 246), width=2)
        draw.text((fx + 24, fy + 2), feature, font=fonts['feature'], fill=(255, 255, 255, 240))
    
    cta_text = "Simplify Your Day"
    cta_y = 420
    cta_x = 55
    cta_bbox = draw.textbbox((0, 0), cta_text, font=fonts['tagline'])
    cta_width = cta_bbox[2] - cta_bbox[0] + 30
    draw.rounded_rectangle([cta_x, cta_y, cta_x + cta_width, cta_y + 34], radius=17, fill=(255, 255, 255))
    draw.text((cta_x + 15, cta_y + 6), cta_text, font=fonts['tagline'], fill=(37, 99, 235))
    
    final = background.convert('RGB')
    final.save("mockups/featured_graphic.png", "PNG", quality=95)
    final.save("mockups/featured_graphic.jpg", "JPEG", quality=90)
    print(f"Created: mockups/featured_graphic.png (1024x500)")
    print(f"Created: mockups/featured_graphic.jpg (1024x500)")
    return final

if __name__ == "__main__":
    os.makedirs("mockups", exist_ok=True)
    create_featured_graphic()
    print("\nFeatured graphic ready for Google Play!")
