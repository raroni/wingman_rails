Gem::Specification.new do |s|
  s.name        = "wingman_rails"
  s.version     = "0.0.1"
  s.authors     = ["Rasmus Rønn Nielsen"]
  s.email       = ["rasmusrnielsen@gmail.com"]
  s.summary     = "Use Wingman with Rails 3"
  s.description = "This gem provides Wingman for your Rails 3 application."

  s.add_dependency "railties", ">= 3.2.0", "< 5.0"

  s.files           = Dir["{lib,vendor}/**/*"]
  s.require_path = 'lib'
end
