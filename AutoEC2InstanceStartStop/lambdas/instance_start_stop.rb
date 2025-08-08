

def handler(event:, context:)
  action = event['action']

  unless ['start', 'stop'].include?(action)
    raise "Invalid action: #{action}"
  end

  puts action
end